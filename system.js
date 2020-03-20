"use strict"


// SHADER 3D MINIMUM

var illum_vert=`#version 300 es
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat3 normalMatrix;

in vec3 position_in;
in vec3 normal_in;
in vec2 texcoord_in;

out vec2 tc;
out vec3 Po;
out vec3 No;

void main()
{
	tc = vec2(texcoord_in.x, 1.0 - texcoord_in.y);
	No = normalMatrix * normal_in;
	vec4 Po4 = viewMatrix * vec4(position_in,1);
	Po = Po4.xyz;
	gl_Position = projectionMatrix * Po4;
}`;

var illum_frag=`#version 300 es
precision highp float;
in vec3 Po;
in vec3 No;
in vec2 tc;

out vec4 frag_out;

vec3 color_back = vec3(0.0,0.0,0.0);
float specness = 0.5;
float shininess = 0.2;

uniform sampler2D TU0;
uniform vec3 light_pos;

void main()
{
	vec3 c1 = texture(TU0,tc).rgb;

	vec3 N = normalize(No);
	vec3 L = normalize(light_pos-Po);
	float ps = dot(N,L); 
	float lamb = clamp(ps,0.1,1.0);	
	frag_out = vec4(c1*lamb,1);
		
}`;
var illum_frag_earth=`#version 300 es
precision highp float;
in vec3 Po;
in vec3 No;
in vec2 tc;

out vec4 frag_out;

vec3 color_back = vec3(0.0,0.0,0.0);
float specness = 0.5;
float shininess = 0.2;

uniform sampler2D TU0;
uniform sampler2D TU1;
uniform vec3 light_pos;

void main()
{
	vec3 c1 = texture(TU0,tc).rgb;
	vec3 c2 = texture(TU1,tc).rgb;

	vec3 N = normalize(No);
	vec3 L = normalize(light_pos-Po);
	float ps = dot(N,L); 
	float lamb = clamp(ps,0.0,1.0);
	frag_out = vec4(mix(c2,c1,lamb),1);
		
}`;


var star_vert=`#version 300 es
precision highp float;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
in vec3 position_in;
in vec2 texcoord_in;
out vec2 tc;
void main()
{
  tc = texcoord_in;
  gl_Position = projectionMatrix * viewMatrix * vec4(position_in, 1.0);
}
`;
var color=`#version 300 es
precision highp float;
uniform sampler2D TU0;
in vec2 tc;
out vec4 frag_out;
void main()
{
	vec3 c1 = texture(TU0,tc).rgb;
	frag_out = vec4(c1,1);
}`;

var circle_vert = `#version 300 es
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform float distance;

void main()
{
	gl_PointSize = 2.0;
	float a = 6.2832*float(gl_VertexID)/float(100);
	gl_Position = projectionMatrix * viewMatrix *vec4(distance*sin(a),distance*cos(a),0,1);
}
`
var circle_frag =`#version 300 es
precision mediump float;
out vec4 frag_out;
void main()
{
	frag_out = vec4(0.6,0.6,0.6,1);
}
`

var d;
var prg_sun = null;
var prg_planets = null;
var prg_earth = null;
var prg_circ = null;
var mesh_rend = null;
var meshring_rend = null;
var tex_sun = null;
var tex_earth = null;
var tex_earth1 = null;
var tex_venus = null;
var tex_mars = null;
var tex_mercury = null;
var tex_jupiter = null;
var tex_uranus = null;
var tex_saturn = null;
var tsat_ring = null;
var tex_neptune = null;
var b=1;
var orb=0;

let light_center = null;

var size = 0.5;
var speed_translation = 1.5;
var speed_rotation = 1.5;
var distance = 3.0;


var BB=0;
let zoom = 50;

var sl_tl = 1;


var t = null;


////touches clavier/////
function onkey_wgl(k)
{
    switch (k) {
        
        case 'ArrowLeft':
            BB.center.x -= zoom/100;
            break;
        case 'ArrowRight':
            BB.center.x += zoom/100;
            break;
        case 'ArrowUp':
            BB.center.y += zoom/100;
            break;
        case 'ArrowDown':
            BB.center.y -= zoom/100;
            break;
        case '+':
        	BB.radius -= zoom/150;
            break;
        case '-':
        	BB.radius += zoom/200;
            break;
        default:
        	return false;
            break;
    }
    update_wgl();
}



///////////////////////////////////////init///////////////////////////////////////////////
function init_wgl()
{

	prg_sun = ShaderProgram(star_vert,color,'star');
	prg_planets = ShaderProgram(illum_vert,illum_frag,'planets');
	prg_earth = ShaderProgram(illum_vert,illum_frag_earth,'eart	h');
	prg_circ = ShaderProgram(circle_vert,circle_frag,'circle');


	/////pas de temps
	setInterval( () => { b += sl_tl.value/400; update_wgl(); }, 40);

	//interface/////////////////////////////
	UserInterface.begin(); // name of html id
	UserInterface.use_field_set('V','Render');
	sl_tl=UserInterface.add_slider('vitesse',1,500,100,update_wgl);
///bouton orbite
	UserInterface.add_check_box('Orbites ',false, (c)=>
	{
		if (c)
		{
			orb=1;
			update_wgl();
		}
		else
		{
			orb=0;
			update_wgl();
		}
	});
///////suivre Terre
UserInterface.add_check_box('Terre ',false, (c)=>
{
	if(c)
	{
		BB.radius -= zoom/10;
			t=setInterval( ()=> {BB.center.x=3*Math.cos(1.0*b*2*Math.PI/360);
			BB.center.y=3*Math.sin(1.0*b*2*Math.PI/360);
			update_wgl();
		},40);
	}
	else
	{

	
		BB.radius += zoom/10;
		window.clearInterval(t);
		t = setInterval( () => { b += sl_tl.value/400; update_wgl(); }, 40);
	}

});

	UserInterface.use_field_set('V',"Clavier");	
	UserInterface.add_label("zoom +/-");
	UserInterface.end_use();
	UserInterface.adjust_width();


	////////fin de l'interface////

    // cree une sphere
	let mesh = Mesh.Sphere(100);
	//creer tore
	let meshring = Mesh.Tore(50);
	//renderer
	BB = mesh.BB;
	mesh_rend = mesh.renderer(true,true,true);
	meshring_rend = meshring.renderer(true,true,true);
  
	
	
	///charger les textures
	tex_sun = Texture2d([gl.TEXTURE_WRAP_S, gl.REPEAT], [gl.TEXTURE_WRAP_T, gl.REPEAT]);
	tex_sun.load("sun.jpg").then(update_wgl);
	
	tex_mercury = Texture2d([gl.TEXTURE_WRAP_S, gl.REPEAT], [gl.TEXTURE_WRAP_T, gl.REPEAT]);
	tex_mercury.load("mercury.jpg").then(update_wgl);
	
	tex_venus = Texture2d([gl.TEXTURE_WRAP_S, gl.REPEAT], [gl.TEXTURE_WRAP_T, gl.REPEAT]);
	tex_venus.load("venus.jpg").then(update_wgl);
	
	tex_earth = Texture2d([gl.TEXTURE_WRAP_S, gl.REPEAT], [gl.TEXTURE_WRAP_T, gl.REPEAT]);
	tex_earth.load("earth.jpg").then(update_wgl);
	
	tex_earth1 = Texture2d([gl.TEXTURE_WRAP_S, gl.REPEAT], [gl.TEXTURE_WRAP_T, gl.REPEAT]);
	tex_earth1.load("earth_night.jpg").then(update_wgl);
	
	tex_mars = Texture2d([gl.TEXTURE_WRAP_S, gl.REPEAT], [gl.TEXTURE_WRAP_T, gl.REPEAT]);
	tex_mars.load("mars.jpg").then(update_wgl);
	
	tex_jupiter = Texture2d([gl.TEXTURE_WRAP_S, gl.REPEAT], [gl.TEXTURE_WRAP_T, gl.REPEAT]);
	tex_jupiter.load("jupiter.jpg").then(update_wgl);
	
	tex_saturn = Texture2d([gl.TEXTURE_WRAP_S, gl.REPEAT], [gl.TEXTURE_WRAP_T, gl.REPEAT]);
	tex_saturn.load("saturne.jpg").then(update_wgl);

	//ring
	tsat_ring = Texture2d();
	tsat_ring.load("saturne_ring.jpg",gl.RGBA8,gl.RGBA,true).then(update_wgl);
	
	tex_uranus = Texture2d([gl.TEXTURE_WRAP_S, gl.REPEAT], [gl.TEXTURE_WRAP_T, gl.REPEAT]);
	tex_uranus.load("uranus.jpg").then(update_wgl);
	
	tex_neptune = Texture2d([gl.TEXTURE_WRAP_S, gl.REPEAT], [gl.TEXTURE_WRAP_T, gl.REPEAT]);
	tex_neptune.load("neptune.jpg").then(update_wgl);

    
	

	/////variable avec la taille des planètes pour orbites
	d = new Float32Array([3,1.5,2,4,5,6,7,8]);
}

function draw_wgl()
{
	gl.clearColor(0,0,0,1);
	gl.enable(gl.DEPTH_TEST);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


	const projection_matrix = scene_camera.get_projection_matrix();
	const view_matrix = scene_camera.get_view_matrix();

	//place caméra
	scene_camera.set_scene_radius(BB.radius+5);
	scene_camera.set_scene_center(BB.center);
	light_center = BB.center;


	///////////////////////orbite////////////////////////
	prg_circ.bind();
	update_uniform('projectionMatrix', projection_matrix);
	update_uniform('viewMatrix',view_matrix);	
	unbind_shader();

	switch(orb){
		case 0:
			break;
		case 1:
			prg_sun.bind();
			update_uniform('projectionMatrix', projection_matrix)
			update_uniform('viewMatrix', view_matrix);
			prg_circ.bind();

		

			for (let a=0; a<8; ++a)
			{
		       
				update_uniform('distance',d[a]);	
				gl.drawArrays(gl.LINE_LOOP, 0, 100);
				


			}
			break;
		default:
			break;
	}
	


//Soleil//
	prg_sun.bind();
	
	tex_sun.bind(0);
	update_uniform('viewMatrix', view_matrix.mult(rotateZ(b)));
	update_uniform('projectionMatrix', projection_matrix);
	mesh_rend.draw(gl.TRIANGLES);
	unbind_texture2d();
	unbind_shader();

//Terre// 2 textures
	prg_earth.bind()
	tex_earth.bind(0);
	tex_earth1.bind(1);
	size = 0.25;	speed_translation = 1;	speed_rotation = 1;	distance = 3;
	t_update(view_matrix,projection_matrix);
	unbind_texture2d();
	unbind_texture2d();
	unbind_shader();


//planètes//
	prg_planets.bind();

	tex_mercury.bind(0);
	size = 0.1;	speed_translation = 0.387/0.24;	speed_rotation = 1.0;	distance = 1.5;
	t_update(view_matrix,projection_matrix);
	unbind_texture2d();

	tex_venus.bind(0);
	size = 0.2;	speed_translation =	0.62/0.723;	speed_rotation = 1.0;	distance = 2;
	t_update(view_matrix,projection_matrix);
	unbind_texture2d();

	
	tex_mars.bind(0);
	size = 0.15;	speed_translation = 1.524/1.88;	speed_rotation = 1.0; distance = 4;
	t_update(view_matrix,projection_matrix);
	unbind_texture2d();

	tex_jupiter.bind(0);
	size = 0.5;	speed_translation = 5.20/11.86;	speed_rotation = 1.0;	distance = 5;
	t_update(view_matrix,projection_matrix);
	unbind_texture2d();
	
	tex_saturn.bind(0);
	size = 0.45;	speed_translation = 9.54/29.54;	speed_rotation = 1.0;	distance = 6;
	t_update(view_matrix,projection_matrix);
	unbind_texture2d();
	tsat_ring.bind(0);
	let vm = mmult(view_matrix,rotateZ(b*speed_translation),translate(distance,0,0),rotateZ(b*speed_rotation),scale(size+1,size+1,0.01));
	update_uniform('viewMatrix', vm);
    update_uniform('projectionMatrix',projection_matrix);
    update_uniform('normalMatrix', 	vm.inverse3transpose());
    let light_posi = view_matrix.mult(Vec4(0,0,0,1));
	update_uniform('light_pos',light_posi.xyz);
	meshring_rend.draw(gl.TRIANGLES);
	unbind_texture2d();
	
	tex_uranus.bind(0);
	size = 0.3;	speed_translation = 19.18/84.01;	speed_rotation = 1.0;	distance = 7;
	t_update(view_matrix,projection_matrix);
	unbind_texture2d();
	
	tex_neptune.bind(0);
	size = 0.3;	speed_translation = 30.06/164.80;	speed_rotation = 1.0;	distance = 8;
	t_update(view_matrix,projection_matrix);
	unbind_texture2d();

	unbind_shader();

}

function t_update(view_matrix,projection_matrix)
{
	let vm = mmult(view_matrix,rotateZ(b*speed_translation),translate(distance,0,0),rotateZ(b*speed_rotation),scale(size));
	update_uniform('viewMatrix', vm);
    update_uniform('projectionMatrix',projection_matrix);
	update_uniform('normalMatrix', 	vm.inverse3transpose());

    let light_posi = view_matrix.mult(Vec4(0,0,0,1));
	update_uniform('light_pos',light_posi.xyz);
	mesh_rend.draw(gl.TRIANGLES);
	
}
	
launch_3d();