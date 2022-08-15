#version 300 es
#define MAX_LIGHTS 100
precision highp float;

in vec3 v_position;
in vec2 v_texCoord;
in vec3 v_normal;

uniform sampler2D u_texture;
uniform vec3 eyePos;

uniform vec4 ambientType;
uniform vec4 diffuseType;
uniform vec4 specularType;
uniform vec4 emissionType;

uniform vec4 lightType[MAX_LIGHTS];
uniform vec3 Pos[MAX_LIGHTS];
uniform vec3 Dir[MAX_LIGHTS];
uniform float ConeOut[MAX_LIGHTS];
uniform float ConeIn[MAX_LIGHTS];
uniform float Decay[MAX_LIGHTS];
uniform float Target[MAX_LIGHTS];
uniform vec4 lightColor[MAX_LIGHTS];

uniform int lightsNumber;

uniform vec4 ambientLightColor;
uniform vec4 ambientLightLowColor;
uniform vec4 SHLeftLightColor;
uniform vec4 SHRightLightColor;
uniform vec3 ADir;
uniform vec4 diffuseColor;
uniform float DTexMix;
uniform vec4 specularColor;
uniform float SpecShine;
uniform float DToonTh;
uniform float SToonTh;
uniform vec4 ambientMatColor;
uniform vec4 emitColor;
// uniform float SspecKwAng;
uniform float specularity; // I think this is also a vaible parameter in phone both normal and toon shading
uniform float specRoughness;
uniform float ONroughness;
uniform float angleWard;
uniform float anisotropicAmount;
uniform float fresnel;


out vec4 out_color;

vec3 compLightDir(vec3 LPos, vec3 LDir, vec4 lightType) {
	//lights
	// -> Point
	vec3 pointLightDir = normalize(LPos - v_position);
	// -> Direct
	vec3 directLightDir = LDir;
	// -> Spot
	vec3 spotLightDir = normalize(LPos - v_position);

	return            directLightDir * lightType.x +
					  pointLightDir * lightType.y +
					  spotLightDir * lightType.z;
}

vec4 compLightColor(vec4 lightColor, float LTarget, float LDecay, vec3 LPos, vec3 LDir,
					float LConeOut, float LConeIn, vec4 lightType) {
	float LCosOut = cos(radians(LConeOut / 2.0));
	float LCosIn = cos(radians(LConeOut * LConeIn / 2.0));

	//lights
	// -> Point
	vec4 pointLightCol = lightColor * pow(LTarget / length(LPos - v_position), LDecay);
	// -> Direct
	vec4 directLightCol = lightColor;
	// // -> Spot
	vec3 spotLightDir = normalize(LPos - v_position);
	float CosAngle = dot(spotLightDir, LDir);
	vec4 spotLightCol = lightColor * pow(LTarget / length(LPos - v_position), LDecay) *
						clamp((CosAngle - LCosOut) / (LCosIn - LCosOut), 0.0, 1.0);
	// ----> Select final component
	return          directLightCol * lightType.x +
					pointLightCol * lightType.y +
					spotLightCol * lightType.z;
}


vec4 compDiffuse(vec3 lightDir, vec4 lightCol, vec3 normalVec, vec4 diffColor, vec3 eyedirVec) {
	// Diffuse
	float LdotN = max(0.0, dot(normalVec, lightDir));
	vec4 LDcol = lightCol * diffColor;
	// --> Lambert
	vec4 diffuseLambert = LDcol * LdotN;
	// --> Toon
	vec4 diffuseToon = max(sign(LdotN- DToonTh),0.0) * LDcol;
	// --> Oren-Nayar
	float VdotN = max(0.0, dot(normalVec, eyedirVec));
	float theta_i = acos(LdotN);
	float theta_r = acos(VdotN);
	float alpha = max(theta_i, theta_r);
	float beta = min(min(theta_i, theta_r), 1.57);
	float sigma2 = ONroughness * ONroughness * 2.46;
	float A = 1.0 - 0.5 * sigma2 / (sigma2 + 0.33);
	float B = 0.45 * sigma2 / (sigma2 + 0.09);
	vec3 v_i = normalize(lightDir - normalVec * LdotN);
	vec3 v_r = normalize(eyedirVec - normalVec * VdotN);
	float G = max(0.0, dot(v_i, v_r));
	vec4 diffuseOrenNayar = diffuseLambert * (A + B * G * sin(alpha) * tan(beta));
	// ----> Select final component
	return         diffuseLambert * diffuseType.x +
				   diffuseToon * diffuseType.y +
				   diffuseOrenNayar * diffuseType.z;
}

vec4 compSpecular(vec3 lightDir, vec4 lightCol, vec3 normalVec, vec3 eyedirVec, vec3 t, vec3 b) {
	// Specular
	float LdotN = max(0.0, dot(normalVec, lightDir));
	vec3 reflection = -reflect(lightDir, normalVec);
	float LdotR = max(dot(reflection, eyedirVec), 0.0);
	vec3 halfVec = normalize(lightDir + eyedirVec);
	float HdotN = max(dot(normalVec, halfVec), 0.0);
	float HdotT = dot(t, halfVec);
	float HdotB = dot(b, halfVec);
	
	vec4 LScol = lightCol * specularColor * max(sign(LdotN),0.0);
	// --> Phong
	vec4 specularPhong = LScol * pow(LdotR, SpecShine);
	// --> Blinn
	vec4 specularBlinn = LScol * pow(HdotN, SpecShine);
	// --> Toon Phong
	vec4 specularToonP = max(sign(LdotR - SToonTh), 0.0) * LScol;
	// --> Toon Blinn
	vec4 specularToonB = max(sign(HdotN - SToonTh), 0.0) * LScol;
	
	// --> Cook-Torrance
	LdotN = max(0.00001, LdotN);
	float VdotN = max(0.00001, dot(normalVec, eyedirVec));
	HdotN = max(0.00001, HdotN);
	float HdotV = max(0.00001, dot(halfVec, eyedirVec));
	float Gm = min(1.0, 2.0 * HdotN * min(VdotN, LdotN) / HdotV);
	float F = fresnel + (1.0 - fresnel) * pow(1.0 - HdotV, 5.0);
	float HtoN2 = HdotN * HdotN;
	float M = (200.0 - specRoughness) / 200.0;
	float M2 = M * M;
	float Ds = exp(- (1.0-HtoN2) / (HtoN2 * M2)) / (3.14159 * M2 * HtoN2 * HtoN2);
	float GGXk = (M+1.0)*(M+1.0)/8.0;
	float GGGX = VdotN * LdotN / (((1.0-GGXk) * VdotN + GGXk)*((1.0-GGXk) * LdotN + GGXk));
	float DGGXn = M2 * M2;
	float DGGXd = HtoN2*(M2 * M2-1.0)+1.0;
	DGGXd = 3.14 * DGGXd * DGGXd;
	float DGGX = DGGXn / DGGXd;
	float DG = specularType.z * GGGX * DGGX + (1.0 - specularType.z) * Gm * Ds;
	
	vec4 specularCookTorrance = LScol * F * DG / (4.0 * VdotN);
	
	// --> Ward
	float alphaX = M2;
	float alphaY = M2 * (1.0 - 0.999*anisotropicAmount);
	float sang = sin(3.14 * angleWard);
	float cang = cos(3.14 * angleWard);
	float wsX = pow(HdotT * cang - HdotB * sang, 2.0);
	float wsY = pow(HdotB * cang + HdotT * sang, 2.0);

	vec4 specularWard = LScol / (12.566*sqrt(VdotN / LdotN*alphaX*alphaY)) * exp(-(wsX / alphaX + wsY / alphaY) / pow(HdotN,2.0)) ;

	// ----> Select final component
	return          specularPhong * specularType.x * (1.0 - specularType.z) * (1.0 - specularType.w) +
					specularBlinn * specularType.y * (1.0 - specularType.z) * (1.0 - specularType.w) +
					specularToonP * specularType.z * specularType.x * (1.0 - specularType.w) +
					specularToonB * specularType.z * specularType.y * (1.0 - specularType.w)+
					specularCookTorrance * specularType.w * specularType.x +
					specularWard * specularType.w * specularType.y;
}

vec4 compAmbient(vec4 ambColor, vec3 normalVec) {
	// Ambient
	// --> Ambient
	vec4 ambientAmbient = ambientLightColor * ambColor;
	// --> Hemispheric
	float amBlend = (dot(normalVec, ADir) + 1.0) / 2.0;
	vec4 ambientHemi = (ambientLightColor * amBlend + ambientLightLowColor * (1.0 - amBlend)) * ambColor;
	// --> Spherical Harmonics
	const mat4 McInv = mat4(vec4(0.25,0.0,-0.25,0.7071),vec4(0.25,0.6124,-0.25,-0.3536),vec4(0.25,-0.6124,-0.25,-0.3536),vec4(0.25,0.0,0.75,0.0));
	mat4 InCols = transpose(mat4(ambientLightLowColor, SHRightLightColor, SHLeftLightColor, ambientLightColor));
	mat4 OutCols = McInv * InCols;
	vec4 ambientSH = vec4((vec4(1,normalVec) * OutCols).rgb, 1.0) * ambColor;

	// ----> Select final component
	return 		   ambientAmbient * ambientType.x +
				   ambientHemi    * ambientType.y +
				   ambientSH      * ambientType.z;
}

void main() {
	vec4 texcol = texture(u_texture, v_texCoord);
	vec4 diffColor = diffuseColor * (1.0-DTexMix) + texcol * DTexMix;
	vec4 ambColor = ambientMatColor * (1.0-DTexMix) + texcol * DTexMix;
	vec4 emit = (emitColor * (1.0-DTexMix)+
				    texcol * DTexMix * 
				   			max(max(emitColor.r, emitColor.g), emitColor.b)) * emissionType.x;	
	vec3 normalVec = normalize(v_normal);
	vec3 eyedirVec = normalize(eyePos - v_position);

	float tbf = max(0.0, sign(abs(normalVec.y) - 0.707));
	vec3 t = normalize(cross(normalVec, vec3(1,0,0)));
	vec3 b = normalize(cross(normalVec, t));

	// //lights
	// vec3 lightDir = compLightDir(Pos, Dir, lightType);
	// vec4 lightCol = compLightColor(lightColor, Target, Decay, Pos, Dir,
	// 								ConeOut, ConeIn, lightType);

	vec4 diffuse = vec4(0.0,0.0,0.0,1.0);
	vec4 specular = vec4(0.0,0.0,0.0,1.0);
	for(int i=0; i<lightsNumber; i++){
		//lights
		vec3 lightDir = compLightDir(Pos[i], Dir[i], lightType[i]);
		vec4 lightCol = compLightColor(lightColor[i], Target[i], Decay[i], Pos[i], Dir[i],
										ConeOut[i], ConeIn[i], lightType[i]);
		
		diffuse = diffuse + compDiffuse(lightDir, lightCol, normalVec, diffColor, eyedirVec);
		specular = specular + compSpecular(lightDir, lightCol, normalVec, eyedirVec, t, b);
	}	

	// Ambient
	vec4 ambient = compAmbient(ambColor, normalVec);
	
	// final steps( sctf and dctf are different from 1 if specular type is Phong/toonPhong/CookTorrance)
	float sctf = (specularity - 1.0) * (specularType.w * specularType.x) + 1.0;
	float dctf = 1.0 - specularity* (specularType.w * specularType.x);
	vec4 color = clamp(ambient+dctf*diffuse + sctf*specular + emit, 0.0, 1.0);
	
	out_color = vec4(color.rgb, 1.0);

	// out_color = color;
}

