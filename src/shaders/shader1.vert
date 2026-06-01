#version 300 es

//@author João Fernandes - 68180
//@author André Narquel - 67870

const int MAX_LIGHTS = 8;

struct LightInfo{
  vec3 ambient;
  vec3 diffuse;
  vec3 specular;
  vec4 position;
  vec3 axis;
  float aperture;
  float cutoff;
  int type;
};

struct MaterialInfo{
  vec3 Ka;
  vec3 Kd;
  vec3 Ks;
  float shininess;
};

uniform int u_n_lights;
uniform LightInfo u_lights[MAX_LIGHTS];
uniform MaterialInfo u_material;

in vec4 a_position;
in vec4 a_normal;

uniform mat4 u_mModelView;
uniform mat4 u_mNormals; 

uniform mat4 mProjection;
out vec4 v_color;

void main(){
  vec4 P = u_mModelView * a_position;
  vec3 posC = P.xyz;

  vec3 N = normalize((u_mNormals * a_normal).xyz);
  vec3 V = normalize(-posC);

  vec3 a_color = vec3(0.0);

  for(int i = 0; i < u_n_lights; i++){
    LightInfo current_light = u_lights[i];

    vec3 Ka_norm = u_material.Ka / 255.0;
    vec3 Kd_norm = u_material.Kd / 255.0;
    vec3 Ks_norm = u_material.Ks / 255.0;

    vec3 ambientColor = (current_light.ambient/255.0) * Ka_norm;
    vec3 diffuseColor = (current_light.diffuse/255.0) * Kd_norm;
    vec3 specularColor = (current_light.specular/255.0) * Ks_norm;

    vec3 L;
    float attenuation = 1.0;
    
    if(current_light.type == 1){
      L = normalize(current_light.position.xyz);
    } else {
      L = normalize(current_light.position.xyz - posC);
    }

    float diffuseFactor = max(dot(L, N), 0.0);
    vec3 diffuse = diffuseFactor * diffuseColor;

    vec3 H = normalize(L + V);
    float specularFactor = pow(max(dot(N, H), 0.0), u_material.shininess);
    vec3 specular = specularFactor * specularColor;

    if(current_light.type == 2){
      vec3 spotDir = normalize(-current_light.axis);
      float cosAlpha = dot(normalize(L), spotDir);

      float cutoff = current_light.cutoff;
      float apertureAngle = cos(radians(current_light.aperture));
     
      if(cosAlpha < apertureAngle){
        diffuse = vec3(0, 0, 0);
        specular = vec3(0, 0, 0);
      } else {
        attenuation = pow(cosAlpha , cutoff);
      }
    }


    if(dot(L, N) < 0.0) {
      specular = vec3(0.0);
    }
    
    a_color += ambientColor + attenuation * (diffuse + specular);
  }

  v_color = vec4(a_color, 1.0);
  gl_Position = mProjection * P;
}