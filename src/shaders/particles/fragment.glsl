varying vec3 vColor;


void main() {

    vec3 color = vColor;

    vec2 uv = gl_PointCoord;
    float distanceFromCenter = length(uv - 0.5);
    float alpha = 0.05 / distanceFromCenter - 0.1;

    gl_FragColor = vec4(color, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}