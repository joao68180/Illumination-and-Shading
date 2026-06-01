#version 300 es

//@author João Fernandes - 68180
//@author André Narquel - 67870

uniform mat4 u_mModelView;
uniform mat4 u_mNormals; 
uniform mat4 mProjection; 

in vec4 a_position;
in vec4 a_normal;

out vec3 v_normal;
out vec3 v_positionC;

void main(){
    vec4 P = u_mModelView * a_position;
    
    v_positionC = P.xyz;
    v_normal = normalize((u_mNormals * a_normal).xyz);

    gl_Position = mProjection * P;
}