
varying vec3 vColor;
uniform vec3 uPrimaryColor;
uniform vec3 uSecondaryColor;

void main() { 

    vec3 color = mix(uPrimaryColor, uSecondaryColor, vColor.r);

    vec2 uv = gl_PointCoord;
    float distanceFromCenter = length(uv - 0.5);
    float alpha = 0.05 / distanceFromCenter - 0.1;

 


    gl_FragColor = vec4(color, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
} 