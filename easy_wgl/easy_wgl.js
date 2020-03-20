"use strict";


var logBackup = console.log;

console.log = function() {
	ewgl_console.info.apply(ewgl_console,arguments);
    logBackup.apply(console, arguments);
};


function loadRequiredFiles(files,callback)
{
	let loadRqFi = function(files,callback)
	{
		let filesloaded = 0;
		function finishLoad() 
		{
			if (filesloaded === files.length) 
			{
				callback();
			}
		}
	
		if (files.length === 0)
		{
			callback();
			return;
		}

		files.forEach( (s) =>
		{
			let ext = s.substr(s.lastIndexOf('.'));
			switch(ext)
			{
				case '.css':
				let style = document.createElement('link');
				style.rel = 'stylesheet';
				style.href = s;
				style.type = 'text/css';
				style.onload = () => {filesloaded++;finishLoad();};
				document.head.appendChild(style);
				break;
				case '.js':
				let script = document.createElement('script');
				script.type = 'text/javascript';
				script.src = s;
				script.onload = () => {filesloaded++;finishLoad();};
				document.body.appendChild(script);
				break;
			}
		});
	};
	
	if (files.length > 1)
	{
		let first = files.shift();
		loadRqFi(first, () => { loadRequiredFiles(files,callback);});
	}
	else
	{
		loadRqFi(files[0], callback);
	}
}

function ewgl_get_path()
{
	let scr = document.getElementById("ewgl_script");
	let full_path = scr.getAttribute('src');
	return full_path.substr(0,full_path.indexOf('easy_wgl/'));
}

var ewgl_path;

function ewgl_add_path(l,p)
{
	let nl=[];
	l.forEach(f => nl.push(f.length>0?ewgl_path+f:''));
	return nl;
}


function ewgl_make_ref(cst)
{
	return {value:cst};
}


////////////////////////////////////////////////////////////////////////
//	BUFFER
////////////////////////////////////////////////////////////////////////

const BufferVec =
{
	last: 0
	,
	affect_Vec: function(i,v)
	{
		let j = i*v.dim;
		for (let k =0; k< v.dim; k++)
		{
			this[j++] = v.data[k];
		}	
	}
	,
	push: function(v)
	{
		let d = (Array.isArray(v))?v:v.data;
		for (let k =0; k< d.length; k++)
		{
			this[this.last++] = d[k];
		}
	}
	,
	get_vec2: function(i)
	{
		return Vec2(this[2*i],this[2*i+1]);
	}
	,
	get_vec3: function(i)
	{
		return Vec3(this[3*i],this[3*i+1],this[3*i+2]);
	}
	,
	get_vec4: function(i)
	{
		return Vec4(this[4*i],this[4*i+1],this[4*i+2],this[4*i+3]);
	}
};

const BufferScalar =
{
	last: 0
	,
	push: function(v)
	{
		this[this.last++] = v;
	}
};


function create_vec2_buffer(nb)
{
	return Object.assign(new Float32Array(nb*2), BufferVec);
}

function create_vec3_buffer(nb)
{
	return Object.assign(new Float32Array(nb*3), BufferVec);
}

function create_vec4_buffer(nb)
{
	return Object.assign(new Float32Array(nb*4), BufferVec);
}

function create_uint32_buffer(nb)
{
	return Object.assign(new Uint32Array(nb), BufferScalar);
}


////////////////////////////////////////////////////////////////////////
//	MATRICE / VECTEUR
////////////////////////////////////////////////////////////////////////

const Vec_ops =
{
	get is_vector()
	{
		return true;
	},
	copy: function(v)
	{
		const src = v.data;
		const n = src.length;
		let dst = this.data;
		for ( let i=0; i<n; ++i)
		{
			dst[i]=src[i];
		}
		return this;
	},

	forEach: function(f)
	{
		this.data.forEach(f);
	},

	norm: function()
	{
		return Math.sqrt(this.dot(this));
	},

	length: this.norm,

	normalized: function()
	{
		const n2 = this.dot(this);
		if (Math.abs(n2-1)<0.00002)
		{
			return  this;
		}
		return  this.mult(1/Math.sqrt(n2));
	},

	add: function(vb)
	{
		const a = this.data;
		const n = a.length;
		let vc = this.Vec();
		let c = vc.data;
		const b = vb.data;

		for (let i = 0; i < n; i++)
		{
			c[i] = a[i] + b[i];
		}
		return vc;
	},

	self_add: function(vb)
	{
		let a = this.data;
		const n = a.length;
		const b = vb.data;

		for (let i = 0; i < n; i++)
		{
			a[i] += b[i];
		}
	},


	sub: function(vb)
	{
		const a = this.data;
		const n = a.length;
		let vc = this.Vec();
		let c = vc.data;
		const b = vb.data;

		for (let i = 0; i < n; i++)
		{
			c[i] = a[i] - b[i];
		}
		return vc;
	},

	self_sub: function(vb)
	{
		let a = this.data;
		const n = a.length;
		const b = vb.data;

		for (let i = 0; i < n; i++)
		{
			a[i] -= b[i];
		}
	},


	scalarmult: function(s)
	{
		const a = this.data;
		const n = a.length;
		let vc = this.Vec();
		let c = vc.data;
				
		for (let i = 0; i < n; i++)
		{
			c[i] = a[i] * s;
		}
		return vc;
	},

	self_scalarmult: function(vb)
	{
		const a = this.data;
		const n = a.length;

		for (let i = 0; i < n; i++)
		{
			a[i] *= s;
		}
	},


	mult: function(vb)
	{
		if (vb.data === undefined)
		{
			return this.scalarmult(vb);
		}
		const a = this.data;
		const n = a.length;
		let vc = this.Vec();
		let c = vc.data;
		const b = vb.data;

		for (let i = 0; i < n; i++)
		{
			c[i] = a[i] * b[i];
		}
		return vc;
	},

	self_mult: function(vb)
	{
		if (vb.data === undefined)
		{
			this.scalarmult(vb);
		}

		const a = this.data;
		const n = a.length;
		const b = vb.data;

		for (let i = 0; i < n; i++)
		{
			 a[i] *= b[i];
		}
	},


	neg: function(res)
	{
		return this.scalarmult(-1);
	}, 

	dot: function(vb)
	{
		const a = this.data;
		const n = a.length;
		const b = vb.data;
		let d = 0;

		for (let i = 0; i < n; i++)
		{
			d += a[i] * b[i];
		}
		return d;
	},



	at: function(i)
	{
		return this.data[i];
	},

	get xyz()
	{
		return  Vec3(this.data[0] ,this.data[1], this.data[2]);
	},

	get xy()
	{
		return  Vec2(this.data[0] ,this.data[1]);
	},
	get x()
	{
		return this.data[0];
	},
	get y()
	{
		return this.data[1];
	},
	get z()
	{
		return this.data[2];
	},
	get w()
	{
		return this.data[3];
	},
	set x(v)
	{
		this.data[0] = v;
	},
	set y(v)
	{
		this.data[1] = v;
	},
	set z(v)
	{
		this.data[2] = v;
	},
	set w(v)
	{
		this.data[3] = v;
	}
};


let Vec2_ops = Object.assign(Object.create(Vec_ops),
{
	cross: function(v)
	{
		return this.data[0]*v.data[1] - this.data[1]*v.data[0];
	}
});

let Vec3_ops = Object.assign(Object.create(Vec_ops),
{
	cross: function(v)
	{
		const x = this.data[1]*v.data[2] - this.data[2]*v.data[1];
		const y = this.data[2]*v.data[0] - this.data[0]*v.data[2];
		const z = this.data[0]*v.data[1] - this.data[1]*v.data[0];
		return Vec3(x,y,z);
	}
});


function Vec2() 
{
	let data = new Float32Array(2);

	if (arguments.length ==1){
		data[0] = arguments[0];
		data[1] = arguments[0];
	}
	else
	{
		let j = 0;
		for (let i=0; i<arguments.length; i++)
		{
			if (arguments[i].data != undefined)
			{
				arguments[i].data.forEach( e => {data[j++]=e;});
			}
			else
			{
				data[j++] = arguments[i];
			}
		}
	}

	return Object.assign(Object.create(Vec2_ops), {data,Vec:Vec2}); 
}

function Vec3() 
{
	let data = new Float32Array(3);

	if (arguments.length ==1)
	{
		data[0] = arguments[0];
		data[1] = arguments[0];
		data[2] = arguments[0];
	}
	else
	{
		let j = 0;
		for (let i=0; i<arguments.length; i++)
		{
			if (arguments[i].data != undefined)
			{
				arguments[i].data.forEach( e => {data[j++]=e;});
			}
			else
			{
				data[j++] = arguments[i];
			}
		}
	}

	return Object.assign(Object.create(Vec3_ops), {data,Vec:Vec3});
}

function Vec3_buff(buff,i) 
{
	let data = buff.subarray(3*i, 3*i+3);
	return Object.assign(Object.create(Vec3_ops), {data,Vec:Vec3});
}

function Vec4() 
{
	let data = new Float32Array(4);

	if (arguments.length ==1)
	{
		data[0] = arguments[0];
		data[1] = arguments[0];
		data[2] = arguments[0];
		data[3] = arguments[0];
	}
	else
	{
		let j = 0;
		for (let i=0; i<arguments.length; i++)
		{
			if (arguments[i].data != undefined)
			{
				arguments[i].data.forEach( e => {data[j++]=e;});
			}
			else 
			{
				data[j++] = arguments[i];
			}
		}
	}

	return Object.assign(Object.create(Vec_ops), {data,Vec:Vec4}); 
}




const Mat_ops =
{
	get is_matrix()
	{
		return true;
	},

	copy: function(v)
	{
		const src = v.data;
		let dst = this.data;
		const n = dst.length;
		for ( let i=0; i<n; ++i)
		{
			dst[i]=src[i];
		}
		return this;
	},

	forEach: function(f)
	{
		this.data.forEach(f);
	},

	id: function()
	{
		const n = this.dim();
		this.data[0] = 1;
		let j = 0;
		for (let i=1;i<n;++i)
		{
			j += n+1;
			this.data[j] = 1;
		}
		return this;
	},

	add: function(mb)
	{
		const n = this.dim();
		let mc = this.Mat();
		let c = mc.data;
		let a = this.data;
		let b = mb.data;

		let nb = n*n;
		for (let i = 0; i < nb; i++)
		{
			c[i] = a[i] + b[i];
		}
		return mc;
	},

	sub: function(mb)
	{
		const n = this.dim();
		let mc = this.Mat();
		let c = mc.data;
		let a = this.data;
		let b = mb.data;

		let nb = n*n;
		for (let i = 0; i < nb; i++)
		{
			c[i] = a[i] - b[i];
		}
		return mc;
	},

	scalarmult: function(s)
	{
		let mc = this.Mat();
		let c = mc.data;
		const a = this.data;

		const nb = a.length;
		for (let i = 0; i < nb; i++)
		{
			c[i] = a[i] * s;
		}
		return mc;
	},
	
	transpose: function()
	{
		let transp = this.Mat();
		let mt = transp.data;
		let m = this.data;
		const n = this.dim();
		const nb = m.length;
		for (let i = 0; i < nb; i++)
		{
			const c = ~~(i/n);
			const l = i%n;
			mt[c*n+l] = m[l*n+c];
		}
		return transp;
	}
}


const Mat2_ops = Object.assign(Object.create(Mat_ops),
{
	vecmult: function(vb)
	{
		const a = this.data;
		const b = vb.data;
		let vc = Vec2();
		vc.data[0] = a[0]*b[0] + a[2]*b[1];
		vc.data = a[1]*b[0] + a[3]*b[1];

		return vc;
	},

	mult: function(mb)
	{
		if (mb.data == undefined)
			return this.scalarmult(mb);

		if (mb.data.length == 4)
		{
			let mc = Mat3();
			let c = mc.data;
			const a = this.data;
			const b = mb.data;

			for (let i = 0; i < 2; i++)
			{
				c[i]	= a[i]*b[0] +  a[i+2]*b[1];
				c[i+2]  = a[i]*b[2] +  a[i+2]*b[3];
			}
			return mc;
		}

		if (mb.data.length == 2)
		{
			return this.vectmult(mb);		
		}
	},

	dim: function () { return 2;}
});




let Mat3_ops = Object.assign(Object.create(Mat_ops),
{
	vecmult: function(vb)
	{
		const a = this.data;
		const b = vb.data;
		let vc = Vec3();
		vc.data[0] = a[0]*b[0] + a[3]*b[1] + a[6]*b[2];
		vc.data[1] = a[1]*b[0] + a[4]*b[1] + a[7]*b[2];
		vc.data[2] = a[2]*b[0] + a[5]*b[1] + a[8]*b[2];
		return vc;
	},
	
	mult: function(mb)
	{
		if (mb.data == undefined)
			return this.scalarmult(mb);

		if (mb.data.length == 9)
		{
			let mc = Mat3();
			let c = mc.data;
			const a = this.data;
			const b = mb.data;

			for (let i = 0; i < 3; i++)
			{
				c[i]	= a[i]*b[0] +  a[i+3]*b[1] + a[i+6]*b[2];
				c[i+3]  = a[i]*b[3] +  a[i+3]*b[4] + a[i+6]*b[5];
				c[i+6]  = a[i]*b[6] +  a[i+3]*b[7] + a[i+6]*b[8];
			}
			return mc;
		}

		if (mb.data.length == 3)
		{
			return this.vecmult(mb);		
		}
	},

	dim: function() { return 3;}
});



let Mat4_ops = Object.assign(Object.create(Mat_ops),
{
	vecmult: function (vb)
	{
		const a = this.data;
		const b = vb.data;
		let vc = Vec4();
		vc.data[0] = a[0]*b[0] + a[4]*b[1] + a[8]*b[2] +  a[12]*b[3];
		vc.data[1] = a[1]*b[0] + a[5]*b[1] + a[9]*b[2] +  a[13]*b[3];
		vc.data[2] = a[2]*b[0] + a[6]*b[1] + a[10]*b[2] + a[14]*b[3];
		vc.data[3] = a[3]*b[0] + a[7]*b[1] + a[11]*b[2] + a[15]*b[3];

		return vc;
	},

	mult: function(mb)
	{
		if (mb.data === undefined)
		{
			return this.scalarmult(mb);
		}

		if (mb.data.length == 16)
		{
			let mc = Mat4();
			let c = mc.data;
			const a = this.data;
			const b = mb.data;

			for (let i = 0; i < 4; i++)
			{
				c[i]	= a[i]*b[0] +  a[i+4]*b[1] +  a[i+8]*b[2] +  a[i+12]*b[3];
				c[i+4]  = a[i]*b[4] +  a[i+4]*b[5] +  a[i+8]*b[6] +  a[i+12]*b[7];
				c[i+8]  = a[i]*b[8] +  a[i+4]*b[9] +  a[i+8]*b[10] + a[i+12]*b[11];
				c[i+12] = a[i]*b[12] + a[i+4]*b[13] + a[i+8]*b[14] + a[i+12]*b[15];
			}
			return mc;
		}

		if (mb.data.length == 4)
		{
			return this.vecmult(mb);		
		}
	},

	mult3: function(mb)
	{
		let mc = Mat4();
		let c = mc.data;
		const a = this.data;
		const b = mb.data;
		for (let i = 0; i < 3; i++)
		{
			c[i]	= a[i]*b[0] +  a[i+4]*b[1] +  a[i+8]*b[2];
			c[i+4]  = a[i]*b[4] +  a[i+4]*b[5] +  a[i+8]*b[6];
			c[i+8]  = a[i]*b[8] +  a[i+4]*b[9] +  a[i+8]*b[10];
		}
		c[3]=a[3]; c[7]=a[7]; c[11]=a[11]; c[15]=a[15];
		c[12]=a[12]; c[13]=a[13]; c[14]=a[14]; 
		return mc;
	},


	pre_mult3: function(mb)
	{
		let mc = Mat4();
		let c = mc.data;
		const b = this.data;
		const a = mb.data;
		for (let i = 0; i < 3; i++)
		{
			c[i]	= a[i]*b[0] +  a[i+4]*b[1] +  a[i+8]*b[2];
			c[i+4]  = a[i]*b[4] +  a[i+4]*b[5] +  a[i+8]*b[6];
			c[i+8]  = a[i]*b[8] +  a[i+4]*b[9] +  a[i+8]*b[10];
		}
		c[3]=b[3]; c[7]=b[7]; c[11]=b[11]; c[15]=b[15];
		c[12]=b[12]; c[13]=b[13]; c[14]=b[14]; 
		return mc;
	},

	inverse3: function()
	{
		let invm = Mat3();
		let inv = invm.data;
		const m = this.data;

		const t00 = m[1 * 4 + 1] * m[2 * 4 + 2] - m[1 * 4 + 2] * m[2 * 4 + 1];
		const t10 = m[0 * 4 + 1] * m[2 * 4 + 2] - m[0 * 4 + 2] * m[2 * 4 + 1];
		const t20 = m[0 * 4 + 1] * m[1 * 4 + 2] - m[0 * 4 + 2] * m[1 * 4 + 1];
		const d = 1.0 / (m[0 * 4 + 0] * t00 - m[1 * 4 + 0] * t10 + m[2 * 4 + 0] * t20);
		inv[0] =   d * t00;
		inv[1] =  -d * t10;
		inv[2] =   d * t20;
		inv[3] =  -d * (m[1 * 4 + 0] * m[2 * 4 + 2] - m[1 * 4 + 2] * m[2 * 4 + 0]);
		inv[4] =   d * (m[0 * 4 + 0] * m[2 * 4 + 2] - m[0 * 4 + 2] * m[2 * 4 + 0]);
		inv[5] =  -d * (m[0 * 4 + 0] * m[1 * 4 + 2] - m[0 * 4 + 2] * m[1 * 4 + 0]);
		inv[6] =   d * (m[1 * 4 + 0] * m[2 * 4 + 1] - m[1 * 4 + 1] * m[2 * 4 + 0]);
		inv[7] =  -d * (m[0 * 4 + 0] * m[2 * 4 + 1] - m[0 * 4 + 1] * m[2 * 4 + 0]);
		inv[8]=   d * (m[0 * 4 + 0] * m[1 * 4 + 1] - m[0 * 4 + 1] * m[1 * 4 + 0]);
		return invm
	},

	inverse3transpose: function()
	{
		let invm = Mat3();
		let inv = invm.data;
		const m = this.data;

		const t00 = m[1 * 4 + 1] * m[2 * 4 + 2] - m[1 * 4 + 2] * m[2 * 4 + 1];
		const t10 = m[0 * 4 + 1] * m[2 * 4 + 2] - m[0 * 4 + 2] * m[2 * 4 + 1];
		const t20 = m[0 * 4 + 1] * m[1 * 4 + 2] - m[0 * 4 + 2] * m[1 * 4 + 1];
		const d = 1.0 / (m[0 * 4 + 0] * t00 - m[1 * 4 + 0] * t10 + m[2 * 4 + 0] * t20);
		inv[0] =   d * t00;
		inv[3] =  -d * t10;
		inv[6] =   d * t20;
		inv[1] =  -d * (m[1 * 4 + 0] * m[2 * 4 + 2] - m[1 * 4 + 2] * m[2 * 4 + 0]);
		inv[4] =   d * (m[0 * 4 + 0] * m[2 * 4 + 2] - m[0 * 4 + 2] * m[2 * 4 + 0]);
		inv[7] =  -d * (m[0 * 4 + 0] * m[1 * 4 + 2] - m[0 * 4 + 2] * m[1 * 4 + 0]);
		inv[2] =   d * (m[1 * 4 + 0] * m[2 * 4 + 1] - m[1 * 4 + 1] * m[2 * 4 + 0]);
		inv[5] =  -d * (m[0 * 4 + 0] * m[2 * 4 + 1] - m[0 * 4 + 1] * m[2 * 4 + 0]);
		inv[8]=   d * (m[0 * 4 + 0] * m[1 * 4 + 1] - m[0 * 4 + 1] * m[1 * 4 + 0]);
		return invm
	},
	
	inverse: function()
	{
		let invm = Mat4();
		let inv = invm.data;
		const m = this.data;
		const m00 = m[0];
		const m01 = m[1];
		const m02 = m[2];
		const m03 = m[3];
		const m10 = m[4];
		const m11 = m[5];
		const m12 = m[6];
		const m13 = m[7];
		const m20 = m[8];
		const m21 = m[9];
		const m22 = m[10];
		const m23 = m[11];
		const m30 = m[12];
		const m31 = m[13];
		const m32 = m[14];
		const m33 = m[15];
		const tmp0  = m22 * m33;
		const tmp1  = m32 * m23;
		const tmp2  = m12 * m33;
		const tmp3  = m32 * m13;
		const tmp4  = m12 * m23;
		const tmp5  = m22 * m13;
		const tmp6  = m02 * m33;
		const tmp7  = m32 * m03;
		const tmp8  = m02 * m23;
		const tmp9  = m22 * m03;
		const tmp10 = m02 * m13;
		const tmp11 = m12 * m03;
		const tmp12 = m20 * m31;
		const tmp13 = m30 * m21;
		const tmp14 = m10 * m31;
		const tmp15 = m30 * m11;
		const tmp16 = m10 * m21;
		const tmp17 = m20 * m11;
		const tmp18 = m00 * m31;
		const tmp19 = m30 * m01;
		const tmp20 = m00 * m21;
		const tmp21 = m20 * m01;
		const tmp22 = m00 * m11;
		const tmp23 = m10 * m01;

		const t0 = (tmp0 * m11 + tmp3 * m21 + tmp4 * m31) -
			(tmp1 * m11 + tmp2 * m21 + tmp5 * m31);
		const t1 = (tmp1 * m01 + tmp6 * m21 + tmp9 * m31) -
			(tmp0 * m01 + tmp7 * m21 + tmp8 * m31);
		const t2 = (tmp2 * m01 + tmp7 * m11 + tmp10 * m31) -
			(tmp3 * m01 + tmp6 * m11 + tmp11 * m31);
		const t3 = (tmp5 * m01 + tmp8 * m11 + tmp11 * m21) -
			(tmp4 * m01 + tmp9 * m11 + tmp10 * m21);

		const d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

		inv[0] = d * t0;
		inv[1] = d * t1;
		inv[2] = d * t2;
		inv[3] = d * t3;
		inv[4] = d * ((tmp1 * m10 + tmp2 * m20 + tmp5 * m30) -
			  (tmp0 * m10 + tmp3 * m20 + tmp4 * m30));
		inv[5] = d * ((tmp0 * m00 + tmp7 * m20 + tmp8 * m30) -
			  (tmp1 * m00 + tmp6 * m20 + tmp9 * m30));
		inv[6] = d * ((tmp3 * m00 + tmp6 * m10 + tmp11 * m30) -
			  (tmp2 * m00 + tmp7 * m10 + tmp10 * m30));
		inv[7] = d * ((tmp4 * m00 + tmp9 * m10 + tmp10 * m20) -
			  (tmp5 * m00 + tmp8 * m10 + tmp11 * m20));
		inv[8] = d * ((tmp12 * m13 + tmp15 * m23 + tmp16 * m33) -
			  (tmp13 * m13 + tmp14 * m23 + tmp17 * m33));
		inv[9] = d * ((tmp13 * m03 + tmp18 * m23 + tmp21 * m33) -
			  (tmp12 * m03 + tmp19 * m23 + tmp20 * m33));
		inv[10] = d * ((tmp14 * m03 + tmp19 * m13 + tmp22 * m33) -
			  (tmp15 * m03 + tmp18 * m13 + tmp23 * m33));
		inv[11] = d * ((tmp17 * m03 + tmp20 * m13 + tmp23 * m23) -
			  (tmp16 * m03 + tmp21 * m13 + tmp22 * m23));
		inv[12] = d * ((tmp14 * m22 + tmp17 * m32 + tmp13 * m12) -
			  (tmp16 * m32 + tmp12 * m12 + tmp15 * m22));
		inv[13] = d * ((tmp20 * m32 + tmp12 * m02 + tmp19 * m22) -
			  (tmp18 * m22 + tmp21 * m32 + tmp13 * m02));
		inv[14] = d * ((tmp18 * m12 + tmp23 * m32 + tmp15 * m02) -
			  (tmp22 * m32 + tmp14 * m02 + tmp19 * m12));
		inv[15] = d * ((tmp22 * m22 + tmp16 * m02 + tmp21 * m12) -
			  (tmp20 * m12 + tmp23 * m22 + tmp17 * m02));

		return invm;
	},

	transform: function(vb)
	{
		const a = this.data;
		const b = vb.data;

		const x = a[0]*b[0] + a[4]*b[1] + a[8]*b[2] +  a[12];
		const y = a[1]*b[0] + a[5]*b[1] + a[9]*b[2] +  a[13];
		const z = a[2]*b[0] + a[6]*b[1] + a[10]*b[2] + a[14];
		const w = a[3]*b[0] + a[7]*b[1] + a[11]*b[2] + a[15];
		let c = Vec3();
		c.data[0] = x/w;
		c.data[1] = y/w;
		c.data[2] = z/w;
		return c;
	},

	position: function()
	{
		const m = this.data;
		let pos = Vec3();
		pos.data[0]=m[12];
		pos.data[1]=m[13];
		pos.data[2]=m[14];
		return pos;
	},

	column3: function(i)
	{
		const m = this.data;
		let v = Vec3();
		let b = 4*i;
		v.data[0]=m[b];
		v.data[1]=m[b+1];
		v.data[2]=m[b+2];
		return v;
	},


	orientation: function()
	{
		const m = this.data;
		let ori = Mat4();
		let o = ori.data;
		for (let i=0;i<12;++i)
		{
			o[i]=m[i];
		}
		return ori;
	},


	distance: function()
	{
		const m = this.data;
		return Math.sqrt(m[12]*m[12]+m[13]*m[13]+m[14]*m[14]);
	},

	main_dir: function(d)
	{
		const x = Math.abs(this.data[d*4]);
		const y = Math.abs(this.data[d*4+1]);
		const z = Math.abs(this.data[d*4+2]);
		
		if ((x>y)&&(x>z))
		{
			return 0;
		}
		if (y>z)
		{
			return 1;
		}
		return 2;
	},

	realign: function()
	{
		let m = this.data;
		const xd = this.main_dir(0);
		let l = Math.sqrt(m[0]*m[0]+m[1]*m[1]+m[2]*m[2]);
		for (let i=0; i<3; i++)
		{
			m[i] = (i ==xd) ? Math.sign(m[i])*l :0;			
		}

		const yd = this.main_dir(1);
		l = Math.sqrt(m[4]*m[4]+m[5]*m[5]+m[6]*m[6]);
		for (let i=0; i<3; i++)
		{
			m[4+i] = (i ==yd) ? Math.sign(m[4+i])*l :0;			
		}

		const zd = this.main_dir(2);
		l = Math.sqrt(m[8]*m[8]+m[9]*m[9]+m[10]*m[10]);
		for (let i=0; i<3; i++)
		{
			m[8+i] = (i ==zd) ? Math.sign(m[8+i])*l :0;			
		}
	},

	dim: function()
	{
		return 4;
	},
});



function zeroMat2() 
{
	return Object.assign(Object.create(Mat2_ops),{data:new Float32Array(4), Mat:Mat2});
}


function zeroMat3() 
{
	return Object.assign(Object.create(Mat3_ops),{data:new Float32Array(9), Mat:Mat3});
}


function zeroMat4() 
{
	return Object.assign(Object.create(Mat4_ops),{data:new Float32Array(16), Mat:Mat4});
}

function Mat2() 
{
	return Object.assign(Object.create(Mat2_ops),{data:new Float32Array(4), Mat:Mat2}).id();
}


function Mat3() 
{
	return Object.assign(Object.create(Mat3_ops),{data:new Float32Array(9), Mat:Mat3}).id();
}


function Mat4() 
{
	return Object.assign(Object.create(Mat4_ops),{data:new Float32Array(16), Mat:Mat4}).id();
}

function Mat4_from_f32a(data) 
{
	return Object.assign(Object.create(Mat4_ops),{data, Mat:Mat4});
}


function mmult()
{
	let m = arguments[0];
	const n = arguments.length;
	for (let i=1; i<n; ++i)
	{
		m = m.mult(arguments[i]);
	}
	return m;
}


function scale(sx,sy,sz) 
{
	let res = Mat4();
	let m = res.data;
 	m[0]=sx;
	m[5]=(sy!=undefined)?sy:sx;
	m[10]=(sz!=undefined)?sz:sx;
	return res;
}

function translate(tx,ty,tz) 
{
	let res = Mat4();
	let m = res.data;
	if (ty === undefined)
	{
		m[12]=tx.data[0];
		m[13]=tx.data[1];
		m[14]=tx.data[2];
	}
	else
	{
		m[12]=tx;
		m[13]=ty;
		m[14]=tz;
	}
	return res;
}

function rotateX(beta)
{
	let alpha = Math.PI/180 * beta;
	let res = Mat4();
	let m = res.data;
	const c = Math.cos(alpha);
	const s = Math.sin(alpha);
	m[5] = c;
	m[6] = s;
	m[9] = -s;
	m[10] = c;
	return res;
}

function rotateY(beta)
{
	let alpha = Math.PI/180 * beta;
	let res = Mat4();
	let m = res.data;
	const c = Math.cos(alpha);
	const s = Math.sin(alpha);
	m[0] = c;
	m[2] = -s;
	m[8] = s;
	m[10] = c;
	return res;
}

function rotateZ(beta)
{
	let alpha = Math.PI/180 * beta;
	let res = Mat4();
	let m = res.data;
	const c = Math.cos(alpha);
	const s = Math.sin(alpha);
	m[0] = c;
	m[1] = s;
	m[4] = -s;
	m[5] = c;
	return res;
}


function rotate(beta, axis)
{
	let alpha = Math.PI/180 * beta;
	let res = Mat4();
	let m = res.data;

	const an = axis.normalized();
	const na = an.data;

	const nn = an.mult(an).data;
	const c = Math.cos(alpha);
	const s = Math.sin(alpha);
	const omc = 1 - c;

	m[ 0] = nn[0] + (1 - nn[0]) * c;
	m[ 1] = na[0] * na[1] * omc + na[2] * s;
	m[ 2] = na[0] * na[2] * omc - na[1] * s;
	m[ 3] = 0;
	m[ 4] = na[0] * na[1] * omc - na[2] * s;
	m[ 5] = nn[1] + (1 - nn[1]) * c;
	m[ 6] = na[1] * na[2] * omc + na[0] * s;
	m[ 7] = 0;
	m[ 8] = na[0]* na[2] * omc + na[1] * s;
	m[ 9] = na[1] * na[2] * omc - na[0] * s;
	m[10] = nn[2] + (1 -nn[2]) * c;
	m[11] = 0;
	m[12] = 0;
	m[13] = 0;
	m[14] = 0;
	m[15] = 1;

	return res;
}


function perspective(fov, aspect, near, far) 
{
	let res = Mat4();
	let m = res.data;

	const rangeInv = 1.0 / (near - far);
	const f = 1.0/Math.tan(fov/2.0);
	if (aspect>1)
	{
		m[0] = f/aspect;
		m[5] = f;
	}
	else
	{
		m[0] = f;
		m[5] = f*aspect;
	}


					 m[1] = 0; m[2] = 0;					m[3] = 0;
	m[4] = 0;				  m[6] = 0;					m[7] = 0;
	m[8] = 0;		m[9] = 0; m[10] = (near+far)*rangeInv; m[11] = -1;
	m[12] = 0;	   m[13]= 0; m[14] = 2*near*far*rangeInv; m[15] = 0;

	return res;
}


function ortho(aspect, near, far) 
{
	let res = Mat4();
	let m = res.data;

	const rangeInv = 1.0 / (near - far);
	if (aspect<1)
	{
		m[0] = 1/aspect;
		m[5] = 1;
	}
	else
	{
		m[0] = 1;
		m[5] = 1/aspect;
	}

			   m[1] = 0; m[2] = 0;					m[3] = 0;
	m[4] = 0;			m[6] = 0;					m[7] = 0;
	m[8] = 0;  m[9] = 0; m[10] = 2*rangeInv;		  m[11] = 0;
	m[12] = 0; m[13]= 0; m[14] = (near+far)*rangeInv; m[15] = 0;

	return res;
}


function lookAt(eye, at, up)
{
	let zAxis = eye.sub(	at).normalized();
	let xAxis = up.cross(zAxis).normalized();
	let yAxis = zAxis.cross(xAxis).normalized();

	let res = Mat4();
	let m = res.data;
	m[0]  = xAxis.x;
	m[4]  = xAxis.y;
	m[8]  = xAxis.z;
	m[12] = - xAxis.dot(eye);

	m[1]  = yAxis.x;
	m[5]  = yAxis.y;
	m[9]  = yAxis.z;
	m[13] = - yAxis.dot(eye);

	m[2]  = zAxis.x;
	m[6]  = zAxis.y;
	m[10] = zAxis.z;
	m[14] = - zAxis.dot(eye);;

	m[3]  = 0
	m[7]  = 0
	m[11] = 0
	m[15] = 1.0;

	return res;
}

function quat_to_Mat4(q)
{
	let m = new Float32Array(16);
	const sqw = q[3]*q[3];
	const sqx = q[0]*q[0];
	const sqy = q[1]*q[1];
	const sqz = q[2]*q[2];

	const invs = 1 / (sqx + sqy + sqz + sqw)
	m[0] = ( sqx - sqy - sqz + sqw)*invs ; 
	m[5] = (-sqx + sqy - sqz + sqw)*invs ;
	m[10] = (-sqx - sqy + sqz + sqw)*invs ;

	let tmp1 = q[0]*q[1];
	let tmp2 = q[2]*q[3];
	m[1] = 2.0 * (tmp1 + tmp2)*invs ;
	m[4] = 2.0 * (tmp1 - tmp2)*invs ;

	tmp1 = q[0]*q[2];
	tmp2 = q[1]*q[3];
	m[2] = 2.0 * (tmp1 - tmp2)*invs ;
	m[8] = 2.0 * (tmp1 + tmp2)*invs ;
	tmp1 = q[1]*q[2];
	tmp2 = q[0]*q[3];
	m[6] = 2.0 * (tmp1 + tmp2)*invs ;
	m[9] = 2.0 * (tmp1 - tmp2)*invs ;
	m[15] = 1;

	return Mat4_from_f32a(m);
}

////////////////////////////////////////////////////////////////////////
//	GL
////////////////////////////////////////////////////////////////////////

var resources_counter = 0;

const POSITION_ATTRIB = 1;
const NORMAL_ATTRIB = 2;
const TEXCOORD_ATTRIB = 3;
const COLOR_ATTRIB = 4;

let VBO_ops = {

update: function(buffer, offset_dst=0)
{
	gl.bindBuffer(gl.ARRAY_BUFFER, this.id);
	gl.bufferSubData(gl.ARRAY_BUFFER, offset_dst*4*this.nb_floats, buffer);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
},

alloc: function(nbv)
{
	gl.bindBuffer(gl.ARRAY_BUFFER, this.id);
	gl.bufferData(gl.ARRAY_BUFFER, nbv*this.nb_floats, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
},

bind: function()
{
	gl.bindBuffer(gl.ARRAY_BUFFER, this.id);
},

}

function VBO(buffer=null, nb_floats=3) 
{
	let id = gl.createBuffer();
	let length=0;

	if (buffer !== null)
	{
		let buff = (buffer.constructor.name === 'Array') ? new Float32Array(buffer) : buffer;
		length = buff.length/nb_floats;

		gl.bindBuffer(gl.ARRAY_BUFFER, id);
		gl.bufferData(gl.ARRAY_BUFFER, buff, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
	}

	return Object.assign(Object.create(VBO_ops),{id,nb_floats,length});
}

function unbind_vbo()
{
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
}


let EBO_ops = {

bind: function()
{
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.id);
},


}

function EBO(buffer) 
{
	let id = gl.createBuffer();
	let length = 0;

	if (buffer !== null)
	{
		let buff = (buffer.constructor.name === 'Array') ? new Uint32Array(buffer) : buffer;
		length = buff.length;

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, id);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, buff, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	}

	return Object.assign(Object.create(EBO_ops),{id,length});
}

function unbind_ebo()
{
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}


let VAO_ops = {
bind: function()
{
	gl.bindVertexArray(this.id);
},

}

function VAO()
{
	let id = gl.createVertexArray();
	gl.bindVertexArray(id);
	let n = arguments.length;
	for (let i=0;i<n;++i)
	{
		let a = arguments[i];
		if (a[1] != null)
		{
			gl.enableVertexAttribArray(a[0]);
			gl.bindBuffer(gl.ARRAY_BUFFER, a[1].id);
			gl.vertexAttribPointer(a[0], a[1].nb_floats, gl.FLOAT, false, 0, 0);
			gl.vertexAttribDivisor(a[0], a[2]|0 );
			gl.bindBuffer(gl.ARRAY_BUFFER, null);
		}
	}
	gl.bindVertexArray(null);
	return Object.assign(Object.create(VAO_ops),{id});
}

function unbind_vao()
{
	gl.bindVertexArray(null);
}

let ShaderProgram_ops=
{
	update_uniform: function()
	{
		let f = this.unif_call_map[arguments[0]];
		if ( f != undefined)
		{
			const l = arguments.length;
			if (l == 2)
			{
				f(arguments[1]);
			}
			else
			{
				let a = [];
				for (let i = 1; i<l; i++)
					if (typeof arguments[i]== 'number')
						a.push(arguments[i]);
					else
						Array.prototype.push.apply(a,arguments[i]);
				f(a);
			}
		}
		else
		{
			if (this.compilation_ok)
			{
				ewgl_console.warning('uniform '+arguments[0]+' not found');
			}
		}
	},

	bind: function ()
	{
		gl.useProgram(this.prg);
		gl.binded_prg = this;
	},

	fix_attribute_loc: function(vsrc, fixed_attr)
	{
		const lines = vsrc.match(/in\s.*;/g);
		if (lines == undefined)
			return;
		for(let i= 0; i < lines.length; i++)
		{
			const attr = lines[i].match(/in\s*(\w*)\s*(\w*)/);
			const aname = attr[2];
			switch(aname)
			{
			case 'position_in':
				gl.bindAttribLocation(this.prg,POSITION_ATTRIB,aname);
				this.locations.set(aname,POSITION_ATTRIB);
				break;
			case 'normal_in':
				gl.bindAttribLocation(this.prg,NORMAL_ATTRIB,aname);
				this.locations.set(aname,NORMAL_ATTRIB);
				break;
			case 'color_in':
				gl.bindAttribLocation(this.prg,COLOR_ATTRIB,aname);
				this.locations.set(aname,COLOR_ATTRIB);
				break;
			case 'texcoord_in':
				gl.bindAttribLocation(this.prg,TEXCOORD_ATTRIB,aname);
				this.locations.set(aname,TEXCOORD_ATTRIB);
				break;
			default:
				this.locations.set(aname,-1);
			break;
			}
		}
		fixed_attr.forEach( (a) => {gl.bindAttribLocation(this.prg,a[1],a[0]);this.locations.set(a[0],a[1]);});
	},

	search_attribute_loc: function()
	{
		this.locations.forEach( (v,k) => 
		{
			if (v<0) 
			{
				let loc = gl.getAttribLocation(this.prg,k)
				this.locations.set(k, loc);
				this['attrib_'+k] = loc;
			}
			else
			{
				this['attrib_'+k] = v;
			}
		});
	},

	remove_comments: function(src)
	{

		let a = src.indexOf("/*");
		let b = (a===-1)?-1:src.indexOf("*/",a);
		while (a >= 0 && b>=0)
		{
			src = src.slice(0,a) + src.slice(b+2);
			a = src.indexOf("/*");
			b = (a===-1)?-1:src.indexOf("*/",a);
		}
		
		a = src.indexOf("//");
		b = (a===-1)?-1:src.indexOf("\n",a);
		while (a >= 0 && b>=0)
		{
			src = src.slice(0,a) + src.slice(b);
			a = src.indexOf("//");
			b = (a===-1)?-1:src.indexOf("\n",a);
		}
		return src;
	},


	search_uniforms: function(vsrc,fsrc)
	{
		function uniform_lines(src)
		{
			let lines = src.match(/uniform\s.*;/g);
			return lines || [];
		}

		let lines= uniform_lines(vsrc).concat(uniform_lines(fsrc));

		for(let i= 0; i < lines.length; i++) 
		{
			if (lines[i])
			{
				const unif = lines[i].match(/uniform\s*(\w*)\s*(\w*)\s*(\w*)/);


				let dec = (lines[i].indexOf('highp') < 0 && lines[i].indexOf('mediump') < 0 && lines[i].indexOf('lowp') < 0) ?0:1;
				

				const utype = unif[1+dec];
				const uname = unif[2+dec];
				const uniformIndices = gl.getUniformIndices(this.prg, [uname]);
				if (uniformIndices[0] <4000000000)
				{
					let uindice =  gl.getUniformLocation(this.prg,uname);
					this.locations[uname] = uindice;		
					const uniformSizes = gl.getActiveUniforms(this.prg, uniformIndices, gl.UNIFORM_SIZE);
					const sz = uniformSizes[0];
					switch (utype)
					{
					case 'bool':
						if (sz ==1)
							this.unif_call_map[uname] = function(v) { gl.uniform1i(uindice,v); };
						else
							this.unif_call_map[uname] = function(v) { gl.uniform1iv(uindice,(v.data==undefined)?v:v.data); };
						break;
					case 'int':
						if (sz ==1)
						this.unif_call_map[uname] = function(v) { gl.uniform1i(uindice,v); };
						else
						this.unif_call_map[uname] = function(v) { gl.uniform1iv(uindice,(v.data==undefined)?v:v.data); };
						break;
					case 'uint':
						if (sz ==1)
						this.unif_call_map[uname] = function(v) { gl.uniform1ui(uindice,v); };
						else
						this.unif_call_map[uname] = function(v) { gl.uniform1uiv(uindice,(v.data==undefined)?v:v.data); };
						break;
					case 'sampler2D':
					case 'isampler2D':
					case 'usampler2D':
					case 'sampler3D':
					case 'isampler3D':
					case 'usampler3D':
						this.unif_call_map[uname] = function(v) { gl.uniform1i(uindice,v); };
						break;
					case 'float':
						if (sz ==1)
						this.unif_call_map[uname] = function(v) { gl.uniform1f(uindice,v); };
						else
						this.unif_call_map[uname] = function(v) { gl.uniform1fv(uindice,(v.data==undefined)?v:v.data); };
						break;
					case 'vec2':
						this.unif_call_map[uname] = function(v) {
							if (v.data)
							{
								gl.uniform2fv(uindice,v.data);
								return;
							}
							if (Array.isArray(v) && v[0].data)
							{
								let length=Math.min(sz,v.length);
								let tempo = new Float32Array(length*2);
								for (let j = 0; j<length; j++)
								{
									tempo.set(v[j].data,j*2);
								}
								gl.uniform2fv(uindice,tempo);
								return;
							}
							gl.uniform2fv(uindice,v);
						};

						break;
					case 'vec3':
						this.unif_call_map[uname] = function(v) {
							if (v.data)
							{
								gl.uniform3fv(uindice,v.data);
								return;
							}
							if (Array.isArray(v) && v[0].data)
							{
								let length=Math.min(sz,v.length);
								let tempo = new Float32Array(length*3);
								for (let j = 0; j<length; j++)
								{
									tempo.set(v[j].data,j*3);
								}
								gl.uniform3fv(uindice,tempo);
								return;
							}
							gl.uniform3fv(uindice,v);
						};
						break;
					case 'vec4':
						this.unif_call_map[uname] = function(v) { 
							if (v.data)
							{
								gl.uniform4fv(uindice,v.data);
								return;
							}
							if (Array.isArray(v) && v[0].data)
							{
								let length=Math.min(sz,v.length);
								let tempo = new Float32Array(length*4);
								for (let j = 0; j<length; j++)
								{
									tempo.set(v[j].data,j*4);
								}
								gl.uniform4fv(uindice,tempo);
								return;
							}
							gl.uniform4fv(uindice,v);
						};

						break;
					case 'mat2':
						this.unif_call_map[uname] = function(v) { gl.uniformMatrix2fv(uindice,false,(v.data==undefined)?v:v.data); };
						break;
					case 'mat3':
						this.unif_call_map[uname] = function(v) { gl.uniformMatrix3fv(uindice,false,(v.data==undefined)?v:v.data); };
						break;
					case 'mat4':
						this.unif_call_map[uname] = function(v) { gl.uniformMatrix4fv(uindice,false,(v.data==undefined)?v:v.data); };
						break;
					}

					this['unif_'+uname] = uindice;
				}
			}
		}
	},

	update_matrices: function(proj,view)
	{
		if (this.unif_projectionMatrix)
		{
			gl.uniformMatrix4fv(this.unif_projectionMatrix,false,(proj.data==undefined)?proj:proj.data);
		}
		if (this.unif_viewMatrix)
		{
			gl.uniformMatrix4fv(this.unif_viewMatrix,false,view.data);
		}
		if (this.unif_normalMatrix)
		{
			let m = view.inverse3transpose();
			gl.uniformMatrix3fv(this.unif_normalMatrix,false,m.data);
		}
	},

	compile_shader: function(src, type, shader_name)
	{
		let shader = gl.createShader(type);
		gl.shaderSource(shader, src);
		gl.compileShader(shader);
		let ok = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
		let infolog = gl.getShaderInfoLog(shader);
		if (!ok) 
		{
			ewgl_console.error("Erreur de compilation dans "+shader_name);
			ewgl_console.error(infolog);
			const errors = infolog.match(/ERROR: (\w*):(\w*):/);
			if (errors != null)
			{
				let num = parseInt(errors[2]);
				let ssrc = src.split('\n');
				let slines = '';
				let i0 = num>5 ? num -5 : 0;
				let ie = num+5 < ssrc.length ? num+5 : ssrc.length;
				for (let i=i0; i<ie; ++i)
				{
					let line = ' '+(i+1);
					for (let j=0;j<5-line.length;++j)
					{
						line += ' ';
					}
					let col = (num===i+1)?"color:#FF4444'>":"color:#00DD00'>";
					slines += "<div style='background-color:black;" + col + line + ': ' + ssrc[i] + "<br></div>";
				}
				ewgl_console.custom(slines);
			}
			gl.deleteShader(shader);
			return null;
		}
		else if (infolog.length > 0)
		{
			ewgl_console.warning("Attention a la compil de "+shader_name);
			ewgl_console.warning(infolog);
		}
		
		return shader;
	},

	compile: function()
	{
		if (this.f_src === undefined)
		{
			return this.compile_transform_feedback_program();
		}
		
		let vs = this.compile_shader(this.v_src, gl['VERTEX_SHADER'], this.sh_name+'.vert');
		let fs = this.compile_shader(this.f_src, gl['FRAGMENT_SHADER'], this.sh_name+'.frag');
		if (!vs || !fs)
		{
			return false;
		}
		gl.attachShader(this.prg, vs);
		gl.attachShader(this.prg, fs);

		let v_ncom = this.remove_comments(this.v_src);
		let f_ncom = this.remove_comments(this.f_src);

		this.fix_attribute_loc(v_ncom,this.sh_fixed_attr);
		gl.linkProgram(this.prg);
		this.search_attribute_loc();
		this.search_uniforms(v_ncom,f_ncom);
		this.compilation_ok = gl.getProgramParameter(this.prg, gl.LINK_STATUS);
		
		let infolog = gl.getProgramInfoLog(this.prg);

		if (!this.compilation_ok)
		{
			gl.deleteProgram(this.prg);
			return false;
		}
		else if (infolog.length > 0)
		{
			ewgl_console.warning("Attention au link de "+this.sh_name);
			ewgl_console.warning(infolog);
		}
		gl.detachShader(this.prg, vs);
		gl.detachShader(this.prg, fs);
		return true;
	},


	create_program: function(fixed_attr)
	{
		this.prg = gl.createProgram();
		this.sh_fixed_attr = fixed_attr;
		this.compile();
	},

/*
	load(v_url,f_url)
	{
		let p1 = new Promise((resolve,reject) => {
				let xhr1 = new XMLHttpRequest();
				xhr1.onload = () => {
					let v_src=xhr1.responseText; 
					let xhr2 = new XMLHttpRequest();
					xhr2.onload = () => {
						let f_src=xhr2.responseText;
						this.create_program(v_src,f_src,v_url,f_url);
						resolve(); 
					};
					xhr2.open("GET", f_url, true);
					xhr2.send();
				};
				xhr1.open("GET", v_url, true);
				xhr1.send();
			});
		return p1;
	},
	*/

	compile_transform_feedback_program: function()
	{
		let fsrc = `#version 300 es 
		precision highp float;void main(){}`

		this.prg = gl.createProgram();
		let vs = this.compile_shader(this.v_src, gl['VERTEX_SHADER'], this.sh_name+'.vert');
		let fs = this.compile_shader(fsrc, gl['FRAGMENT_SHADER'], this.sh_name+'.frag');
		if (!vs || !fs)
		{
			return false;
		}
		gl.attachShader(this.prg, vs);
		gl.attachShader(this.prg, fs);

		let v_ncom = this.remove_comments(this.v_src);

		this.fix_attribute_loc(v_ncom,this.sh_fixed_attr);

		gl.transformFeedbackVaryings(this.prg, this.sh_outs, gl.SEPARATE_ATTRIBS);

		gl.linkProgram(this.prg);
		this.search_attribute_loc();
		this.search_uniforms(v_ncom,'');
		this.compilation_ok = gl.getProgramParameter(this.prg, gl.LINK_STATUS);
		if (!this.compilation_ok)
		{
			ewgl_console.info(gl.getProgramInfoLog(this.prg));
			gl.deleteProgram(this.prg);
			return false;
		}
		return true;
	},

	create_transform_feedback_program: function(outs, fixed_attr )
	{
		this.prg = gl.createProgram();
		this.sh_outs = outs;
		this.sh_fixed_attr = fixed_attr;
		this.compile_transform_feedback_program();
	}

}


var ewgl_prg_list = [];

function ShaderEmptyProgram()
{
	let locations = new Map();
	let unif_call_map = new Map();
	let prg = null;
	let o = Object.assign(Object.create(ShaderProgram_ops),{locations,unif_call_map, prg});
	return o;
}

/**
 * Create a shader program
 * @param {string} vert the vertex-shader source
 * @param {string} frag the fragment-shader source
 * @param {string} name the name of program
 * @param {Array} fixed_attr couples [attribute var, id]
 */
function ShaderProgram(vert, frag, name, fixed_attr=[])
{
	let locations = new Map();
	let unif_call_map = new Map();
	let prg = null;
	let o = Object.assign(Object.create(ShaderProgram_ops),{v_src:vert,f_src:frag,locations,unif_call_map, prg, sh_name:name});
	o.create_program(fixed_attr);

	ewgl_prg_list.push(o);

	return o;
}

function ShaderTransformFeedbackProgram(vert, name, outs, fixed_attr=[])
{
	let locations = new Map();
	let unif_call_map = new Map();
	let prg = null;
	let o = Object.assign(Object.create(ShaderProgram_ops),{v_src:vert,locations,unif_call_map, prg, sh_name:name});

//	let v_src = (vert.length >20)?vert:document.getElementById(vert).text;
	o.create_transform_feedback_program(outs,fixed_attr);

	ewgl_prg_list.push(o);
	return o;
}


function unbind_shader()
{
	gl.useProgram(null);
	gl.binded_prg = null;
}


function update_uniform()
{
	gl.binded_prg.update_uniform(...arguments);
}
/**
 * Update all matrices: proj, view & normal
 * @param {'Mat4'} proj projection matrix
 * @param {'Mat4'} view modelview matrix
 */
function update_matrices(proj=null,view=null)
{
	gl.binded_prg.update_matrices(proj,view);
}

let Texture2d_ops =
{
	alloc: function(w,h, iformat, eformat= gl.RGB, data = null)
	{
		this.iformat = iformat;
		this.width  = w;
		this.height = h;
		gl.bindTexture(gl.TEXTURE_2D, this.id);
		let dt = (data === null) ? gl.UNSIGNED_BYTE : gl_type_of_array.get(data.constructor.name);
		gl.texImage2D(gl.TEXTURE_2D, 0, iformat, w, h, 0, eformat, dt, data);
		gl.bindTexture(gl.TEXTURE_2D, null);
	},

	update: function(eformat, data)
	{
		gl.bindTexture(gl.TEXTURE_2D, this.id);
		let dt = gl_type_of_array.get(data.constructor.name);
		gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.width,this.height, eformat, dt, data);
		gl.bindTexture(gl.TEXTURE_2D, null);
	},


	load: function(url, iformat = gl.RGB8, eformat = gl.RGB, mm = false)
	{
		return new Promise((resolve,reject) => {
			let img = new Image();
			img.src = url;
			img.addEventListener('load', () => 
			{
				this.width = img.width;
				this.height = img.height;
				this.iformat = iformat;
				gl.bindTexture(gl.TEXTURE_2D, this.id);
				gl.texImage2D(gl.TEXTURE_2D, 0, iformat, eformat, gl.UNSIGNED_BYTE, img);
				if (mm)
				{
					gl.generateMipmap(gl.TEXTURE_2D);
				}
				resources_counter++;
				gl.bindTexture(gl.TEXTURE_2D, null);
				resolve();
			});
		});
	},

	bind: function(unit, unif)
	{
		if (unit !== undefined)
		{
			gl.activeTexture(unit + gl.TEXTURE0);
			if (unif !== undefined)
			{
				update_uniform(unif, unit);
			}
			else
			{
				update_uniform('TU'+unit, unit);
			}
		}
		gl.bindTexture(gl.TEXTURE_2D, this.id);
	},
}


function Texture2d()
{
	let id = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, id);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);	
	for(let i=0; i<arguments.length; ++i)
	{
		gl.texParameteri(gl.TEXTURE_2D, arguments[i][0], arguments[i][1]);
	}
	gl.bindTexture(gl.TEXTURE_2D, null);

	return Object.assign(Object.create(Texture2d_ops), {id,width:0,height:0});

}


function unbind_texture2d()
{
	gl.bindTexture(gl.TEXTURE_2D, null);
}


let Texture3d_ops =
{

	alloc: function(w,h,d, iformat, eformat= gl.RGB, data = null)
	{
		this.iformat = iformat;
		this.width  = w;
		this.height = h;
		this.depth  = d;
		gl.bindTexture(gl.TEXTURE_3D, this.id);
		let dt = (data === null) ? gl.UNSIGNED_BYTE : gl_type_of_array.get(data.constructor.name);
//		gl.pixelStorei(gl.UNPACK_ROW_LENGTH, w);
		gl.texImage3D(gl.TEXTURE_3D, 0, iformat, w, h,d, 0, eformat, dt, data);
		gl.bindTexture(gl.TEXTURE_3D, null);
	},

	update: function(eformat, data)
	{
		gl.bindTexture(gl.TEXTURE_3D, this.id);
		let dt = gl_type_of_array.get(data.constructor.name);
		gl.texSubImage3D(gl.TEXTURE_3D, 0, 0, 0, 0, this.width, this.height, this.depth, eformat, dt, data);
		gl.bindTexture(gl.TEXTURE_3D, null);
	},


	bind: function(eng, unif)
	{
		if (eng)
		{
			gl.activeTexture(eng);
		}
		if (unif)
		{
			update_uniform(unif, eng - gl.TEXTURE0);
		}
		gl.bindTexture(gl.TEXTURE_3D, this.id);
	},
}


function Texture3d()
{
	let id = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_3D, id);
	gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);	
	gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);	

	for(let i=0; i<arguments.length; ++i)
	{
		gl.texParameteri(gl.TEXTURE_3D, arguments[i][0], arguments[i][1]);
	}

	return Object.assign(Object.create(Texture3d_ops), {id,width:0,height:0,depth:0});

}

function unbind_texture3d()
{
	gl.bindTexture(gl.TEXTURE_3D, null);
}


let FBO_ops =
{
	bind: function()
	{
		gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.id);
		gl.viewport(0,0,this.w,this.h);
	}
	,

	resize: function(w,h)
	{
		let attach = this.colors_attach;

		attach.forEach ( a => { a.alloc(w,h,a.iformat); });

		if (this.depthRenderBuffer)
		{
			gl.bindRenderbuffer( gl.RENDERBUFFER, this.depthRenderBuffer );
			gl.renderbufferStorage( gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h );
			gl.bindRenderbuffer( gl.RENDERBUFFER, null);
		}
		this.w = w;
		this.h = h;

	},
}



function FBO(colors_attach, depth_attach)
{
	let id = gl.createFramebuffer();
	gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, id);

	let att_enum = [gl.COLOR_ATTACHMENT0,
	gl.COLOR_ATTACHMENT1,
	gl.COLOR_ATTACHMENT2,
	gl.COLOR_ATTACHMENT3,
	gl.COLOR_ATTACHMENT4,
	gl.COLOR_ATTACHMENT5,
	gl.COLOR_ATTACHMENT6,
	gl.COLOR_ATTACHMENT7,
	gl.COLOR_ATTACHMENT8,
	gl.COLOR_ATTACHMENT9];

	if (! Array.isArray(colors_attach))
	{
		colors_attach = [colors_attach];
	}

	for(let i=0; i< colors_attach.length; ++i)
	{
		gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, att_enum[i], gl.TEXTURE_2D, colors_attach[i].id, 0);
	}

	let depthRenderBuffer = null;
	if (depth_attach === true)
	{
		depthRenderBuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer( gl.RENDERBUFFER, depthRenderBuffer );
		gl.renderbufferStorage( gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, colors_attach[0].width, colors_attach[0].height );
		gl.framebufferRenderbuffer(gl.DRAW_FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderBuffer);
		gl.bindRenderbuffer( gl.RENDERBUFFER, null);
	}
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		
	return Object.assign(Object.create(FBO_ops),{id,colors_attach,depthRenderBuffer,w:colors_attach[0].width,h:colors_attach[0].height}); 
}

function unbind_fbo()
{
	gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}



let TransformFeedback_ops = 
{
	start: function(primitive,vbos)
	{
		gl.enable(gl.RASTERIZER_DISCARD);
		gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.id);
		for (let i=0; i<vbos.length; ++i)
		{
			gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, i, vbos[i].id);
		}
		gl.beginTransformFeedback(primitive);
	},

	stop: function()
	{
		gl.endTransformFeedback();
		gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
		gl.disable(gl.RASTERIZER_DISCARD);
	},
}

function TransformFeedback()
{
	let id  = gl.createTransformFeedback();
	return Object.assign(Object.create(TransformFeedback_ops),
	{id});
}



//
// MESH
//

function create_BB()
{
	if (arguments[1].data)
	{
		const A = arguments[0];
		const B = arguments[1];
		let C = A.add(B).mult(0.5)
		let R = B.sub(A).norm()/2;
		return {min:A , max:B, center:C, radius:R};	
	}
	const C = arguments[0];
	const R = arguments[1];
	const vR = Vec3(R,R,R).mult(Math.sqrt(3));
	let A = C.sub(vR);
	let B = C.add(vR);
	return {min:A , max:B, center:C, radius:R};	
}

let Mesh_ops =
{
compute_normals()
{
	let t_start = Date.now();
	const Is= this.tris;
	if (this.normals === null)
	{
		this.normals = new Float32Array(this.positions.length);
	}
	this.normals.fill(0);
	let nb = Is.length;
	for(let i=0;i<nb;)
	{
		let iA = Is[i++];
		let iB = Is[i++];
		let iC = Is[i++];
	
		let jA = 3*iA;
		let jB = 3*iB;
		let jC = 3*iC;
		
		let Ux = this.positions[jB++] - this.positions[jA]; 
		let Vx = this.positions[jC++] - this.positions[jA++]; 
		let Uy = this.positions[jB++] - this.positions[jA]; 
		let Vy = this.positions[jC++] - this.positions[jA++]; 
		let Uz = this.positions[jB] - this.positions[jA]; 
		let Vz = this.positions[jC] - this.positions[jA]; 

		let nf_x = Uy*Vz - Uz*Vy;
		let nf_y = Uz*Vx - Ux*Vz;
		let nf_z = Ux*Vy - Uy*Vx;

		this.normals[jA--] += nf_z;
		this.normals[jA--] += nf_y;
		this.normals[jA] += nf_x;
		this.normals[jB--] += nf_z;
		this.normals[jB--] += nf_y;
		this.normals[jB] += nf_x;
		this.normals[jC--] += nf_z;
		this.normals[jC--] += nf_y;
		this.normals[jC] += nf_x;
	}
	nb = this.normals.length;
	for(let i=0;i<nb;)
	{
		let nf_x = this.normals[i];
		let nf_y = this.normals[i+1];
		let nf_z = this.normals[i+2];
		let no = Math.sqrt(nf_x*nf_x+nf_y*nf_y+nf_z*nf_z);
		this.normals[i++] /= no;
		this.normals[i++] /= no;
		this.normals[i++] /= no;
	}
	ewgl_console.info("Normals computed in: "+(Date.now() - t_start) + ' ms');
},


compute_BB()
{
	let x_min =  this.positions[0];
	let y_min =  this.positions[1];
	let z_min =  this.positions[2];
	let x_max =  x_min;
	let y_max =  y_min;
	let z_max =  z_min;
	
	let nb = this.positions.length;
	for(let i=0;i<nb;)
	{
		const x = this.positions[i++];
		const y = this.positions[i++];
		const z = this.positions[i++];
		if (x < x_min)
		{
			x_min = x;
		}
		if (x > x_max)
		{
			x_max = x;
		}
		if (y < y_min)
		{
			y_min = y;
		}
		if (y > y_max)
		{
			y_max = y;
		}
		if (z < z_min)
		{
			z_min = z;
		}
		if (z > z_max)
		{
			z_max = z;
		}
	}

	let A = Vec3(x_min,y_min,z_min);
	let B = Vec3(x_max,y_max,z_max);
	let C = A.add(B).mult(0.5)
	let R = B.sub(A).norm()/2;
	return {min:A , max:B, center:C, radius:R};
},

renderer: function (p=true, n=true, t=true)
{
	let nbv = 0;
	if (p && !this.vbo_p)
	{
		this.vbo_p = VBO(this.positions,3);
		nbv = this.vbo_p.length;
	}

	if (n && this.normals && !this.vbo_n)
	{
		this.vbo_n =VBO(this.normals,3);
		nbv = this.vbo_n.length;
	}
	
	if (t && this.texcoords && !this.vbo_t)
	{
		this.vbo_t = VBO(this.texcoords,2);
		nbv = this.vbo_t.length;
	}
	
	let vao = VAO([POSITION_ATTRIB, p?this.vbo_p:null], [NORMAL_ATTRIB, n?this.vbo_n:null], [TEXCOORD_ATTRIB, t?this.vbo_t:null]);
	let vao_normal = VAO([POSITION_ATTRIB, p?this.vbo_p:null, 1], [NORMAL_ATTRIB, n?this.vbo_n:null, 1]);

	// let indices_t = EBO(this.tris);
	// let indices_l = EBO(this.lines);
	if (this.indices_t === undefined)
	{
		this.indices_t = EBO(this.tris);
		this.indices_l = EBO(this.lines);
	}

	return Object.assign(Object.create(MeshRenderer_ops),{vao, indices_t:this.indices_t, indices_l:this.indices_l, nbv});
}
};

let MeshRenderer_ops = {
	draw : function(prim, vao=null)
	{
		if (vao != null)
		{
			vao.bind();
		}
		else
		{
			this.vao.bind();
		}
		switch(prim)
		{
		case gl.TRIANGLES:
			this.indices_t.bind();
			gl.drawElements(gl.TRIANGLES, this.indices_t.length, gl.UNSIGNED_INT, 0);
			unbind_ebo();
			break;
		case gl.LINES:
			this.indices_l.bind();
			gl.drawElements(gl.LINES, this.indices_l.length, gl.UNSIGNED_INT, 0);
			unbind_ebo();
			break;
		case gl.POINTS:
			gl.drawArrays(gl.POINTS, 0, this.nbv);
			break;
		}
		unbind_vao();
	},

	draw_normals : function(proj, view, length, color)
	{
		if (prg_normal === null)
		{q
			prg_normal = Shader.Program('normal');
		}
		
		prg_normal.bind();
		update_matrices(proj,view);
		update_uniform('length', length);
		update_uniform('color', color);
		this.vao_normal.bind();
		gl.drawArraysInstanced(gl.LINES, 0, 2, this.nbv);
		unbind_vao();
	}
};


let Mesh = 
{

Cube()
{
	const V=0.5;
	const v=-0.5;
	const BB = create_BB(Vec3(v),Vec3(V));
	return Object.assign(Object.create(Mesh_ops),
		{positions:new Float32Array([v,v,v, V,v,v, V,V,v, v,V,v, v,v,V, V,v,V, V,V,V, v,V,V]),
		vbo_p:null, normals: null, vbo_n:null, texcoords:null, vbo_t:null,
		tris: new Uint32Array([2,1,0,3,2,0, 4,5,6,4,6,7, 0,1,5,0,5,4, 1,2,6,1,6,5, 2,3,7,2,7,6, 3,0,4,3,4,7]),
		lines: new Uint32Array([0,1,1,2,2,3,3,0,4,5,5,6,6,7,7,4,0,4,1,5,2,6,3,7]),BB});
},



Grid_tri_indices(n)
{
	let indices = create_uint32_buffer(6*(n-1)*(n-1));
	let last = 0;
	function push_quad(k)
	{
		indices.push(k);
		indices.push(k-n-1);
		indices.push(k-n);

		indices.push(k-n-1);
		indices.push(k);
		indices.push(k-1);
	}

	for(let j=1;j<n;++j)
		for(let i=1;i<n;++i)
			push_quad(j*n+i);

	return indices;
},

Grid_line_indices(n)
{
	let indices = create_uint32_buffer(4*n*(n-1));

	for(let j=0;j<n;++j)
		for(let i=1;i<n;++i)
		{
			let k =j*n+i;
			indices.push(k);
			indices.push(k-1);
		}

	for(let j=1;j<n;++j)
		for(let i=0;i<n;++i)
		{
			let k =j*n+i;
			indices.push(k);
			indices.push(k-n);
		}
	return indices;
},


Grid(n=2)
{
	const n1 = n - 1;

	let pos = create_vec3_buffer(n*n);
	let norm = create_vec3_buffer(n*n);
	let tc = create_vec2_buffer(n*n);

	for(let j=0;j<n;++j)
	{
		for(let i=0;i<n;++i)
		{
			const u = (1.0/n1)*i;
			const v = (1.0/n1)*j;
			tc.push([u,v]);
			pos.push([(u-0.5)*2,(v-0.5)*2,0]);
			norm.push([0,0,1]);
		}
	}
	const BB = create_BB(Vec3(-1),Vec3(1));

	return Object.assign(Object.create(Mesh_ops), {positions:pos, vbo_p:null, 
			normals: norm, vbo_n:null,
			texcoords:tc, vbo_t:null,
			tris: this.Grid_tri_indices(n), lines: this.Grid_line_indices(n), BB});
},

Tore(n)
{
	const n1 = n - 1;
	let pos = create_vec3_buffer(n*n);
	let norm = create_vec3_buffer(n*n);
	let tc = create_vec2_buffer(n*n);

	let cpos = create_vec3_buffer(n);
	let cnorm = create_vec3_buffer(n);

	for(let i=0;i<n;++i)
	{
		const alpha = ((1.0/n1)*i)*2*Math.PI;
		let p = Vec3(0,Math.sin(alpha),Math.cos(alpha));
		cnorm.push(p);
		cpos.push(p.mult(0.4));
	}

	for(let j=0;j<n;++j)
	{
		let tr = rotate((360/n1)*j,Vec3(0,0,1)).mult(translate(0,0.6,0));
		let ntr = tr.inverse3transpose();
		const v = (1.0/n1)*j;
		for(let i=0;i<n;++i)
		{
			const u = (1.0/n1)*i;
			tc.push([u,v]);
			pos.push(tr.transform(cpos.get_vec3(i)));
			norm.push(ntr.mult(cnorm.get_vec3(i)));
		}
	}

	const BB = create_BB(Vec3(-1),Vec3(1));

	return Object.assign(Object.create(Mesh_ops), {positions:pos, vbo_p:null, 
			normals: norm, vbo_n:null,
			texcoords:tc, vbo_t:null,
			tris: this.Grid_tri_indices(n), lines: this.Grid_line_indices(n), BB});
},


Cylinder(n)
{
	const n1 = n - 1;
	let pos = create_vec3_buffer(n*n);
	let norm = create_vec3_buffer(n*n);
	let tc = create_vec2_buffer(n*n);

	let cpos = create_vec3_buffer(n);
	let cnorm = create_vec3_buffer(n);

	for(let i=0;i<n;++i)
	{
		const alpha = ((1.0/n1)*i)*2*Math.PI;
		let p = Vec3(0,Math.cos(alpha),Math.sin(alpha));
		cnorm.push(p);
		cpos.push(p.mult(0.8));
	}

	for(let j=0;j<n;++j)
	{
		let tr = translate(-1+2/n1*j,0,0);
		let ntr = tr.inverse3transpose();
		const v = (1.0/n1)*j;
		for(let i=0;i<n;++i)
		{
			const u = (1.0/n1)*i;
			tc.push([u,v]);
			pos.push(tr.transform(cpos.get_vec3(i)));
			norm.push(ntr.mult(cnorm.get_vec3(i)));
		}
	}

	const BB = create_BB(Vec3(-1),Vec3(1));

	return Object.assign(Object.create(Mesh_ops), {positions:pos, vbo_p:null, 
			normals: norm, vbo_n:null,
			texcoords:tc, vbo_t:null,
			tris: this.Grid_tri_indices(n), lines: this.Grid_line_indices(n), BB});
},




Sphere(n)
{
	const n1 = n - 1;
	let pos = create_vec3_buffer(n*n);
	let norm = create_vec3_buffer(n*n);
	let tc = create_vec2_buffer(n*n);

	let a1 = Math.PI/n1;
	let a2 = 2*Math.PI/n1;

	for(let j=0;j<n;++j)
	{
		let angle = -Math.PI/2 + a1*j;
		let z = Math.sin(angle);
		let radius = Math.cos(angle);
		const v = (1.0/n1)*j;
		for(let i=0;i<n;++i)
		{
			const u = (1.0/n1)*i;
			tc.push([u,v]);
			let beta = a2*i;
			let p = Vec3(radius*Math.cos(beta), radius*Math.sin(beta),z);
			pos.push(p);
			norm.push(p);
		}
	}

	const BB = create_BB(Vec3(0),2.0);
	
	return Object.assign(Object.create(Mesh_ops), {positions:pos, vbo_p:null, 
			normals: norm, vbo_n:null,
			texcoords:tc, vbo_t:null,
			tris: this.Grid_tri_indices(n), lines: this.Grid_line_indices(n), BB});
},

Wave(n)
{
	const n1 = n - 1;
	let pos = create_vec3_buffer(n*n);
	let norm = create_vec3_buffer(n*n);
	let tc = create_vec2_buffer(n*n);

	for(let j=0;j<n;++j)
	{
		const v = (1.0/n1)*j;
		for(let i=0;i<n;++i)
		{
			const u = (1.0/n1)*i;
			tc.push([u,v]);
			let x = (u-0.5)*2;
			let y = (v-0.5)*2;
			let r = Math.sqrt(x*x+y*y);
			let h = 0.2*(1-r/2)*Math.sin(Math.PI/2+r*8);
			pos.push(Vec3(x,y,h));

			let dh = -0.2/2*Math.sin(Math.PI/2+r*8) + 
					0.2*(1-r/2)*8*Math.cos(Math.PI/2+r*8);
			let n = Vec3(-x/r*dh,-y/r*dh,1);
			norm.push(n.normalized());
		}
	}
	
	const BB = create_BB(Vec3(-1),Vec3(1));

	return Object.assign(Object.create(Mesh_ops), {positions:pos, vbo_p:null, 
			normals: norm, vbo_n:null,
			texcoords:tc, vbo_t:null,
			tris: this.Grid_tri_indices(n), lines: this.Grid_line_indices(n),BB});
},

// JSON_load(text)
// {
// 	let tempo = JSON.parse(text);
// 	let normals=null;
// 	let m = Object.assign(Object.create(Mesh_ops),
// 			{positions:new Float32Array(tempo.pos), vbo_p:null, 
// 			normals, vbo_n:null,
// 			texcoords:null, vbo_t:null,
// 			tris: new Uint32Array(tempo.tris), lines: new Uint32Array(tempo.lines)});

// 	m.compute_normals();
// 	m.BB = m.compute_BB();
// 	return m;
// },

OFF_load(text)
{
	let separator = function(c)
	{
		return c ==" "  ||  c =="\n" ||  c =="\r";
	};

	let index = 0;

	let read_word = function()
	{
		while (separator(text[index])) { index++;}
		let k = index;
		while (!separator(text[index])) { index++;}
		return text.substr(k, index-k);
	};

	let w =read_word();
	w =read_word();
	const nbv = parseInt(w);
	w =read_word();
	const nbf = parseInt(w);
	read_word();
	
	let pos = create_vec3_buffer(nbv);
	let norm = create_vec3_buffer(nbv);

	for(let i=0;i<nbv;++i)
	{
		const p = Vec3(parseFloat(read_word()),parseFloat(read_word()),parseFloat(read_word()));
		pos.push(p);
	}

	const faces_index = index;
	let nbfi = 0;
	let nbl = 0;
	for(let i=0;i<nbf;++i)
	{
		const nbe = parseInt(read_word());
		nbl += nbe;
		nbfi += 3*(nbe-2);
		for(let j=0; j<nbe; j++)
		{
			parseInt(read_word());
		}
	}

	let indices = create_uint32_buffer(nbfi);
	let indicesl = create_uint32_buffer(nbl);

	index = faces_index;
	for(let i=0;i<nbf;++i)
	{
		let nbe = parseInt(read_word());
		let loc_buff = [];
		for(let j=0; j<nbe; j++)
		{
			loc_buff.push(parseInt(read_word()));
		}

		for(let j=0; j<nbe; j++)
		{
			let a = loc_buff[j];
			let b = loc_buff[(j+1)%nbe];
			if (a<b)
			{
				indicesl.push(a);
				indicesl.push(b);
			}
		}

		nbe -= 2;
		for(let j=0; j<nbe; j++)
		{
			indices.push(loc_buff[0]);
			indices.push(loc_buff[j+1]);
			indices.push(loc_buff[j+2]);
		}
	}
	
	let m = Object.assign(Object.create(Mesh_ops), {positions:pos, vbo_p:null, 
			normals: norm, vbo_n:null,
			texcoords:null, vbo_t:null,
			tris: indices, lines: indicesl});

	m.compute_normals();
	m.BB = m.compute_BB();
	return m;
},


OBJ_load(text)
{
	let separator = function(c)
	{
		return c ==" "  ||  c =="\n" ||  c =="\r";
	};

	let endline = function(c)
	{
		return c =="\n" ||  c =="\r";
	};

	let read_word = function()
	{
		while (index < text.length && separator(text[index])) { index++;}
		let k = index;
		while (index < text.length && !separator(text[index])) { index++;}
		return text.substr(k, index-k);
	};

	let read_line = function()
	{
		words = [];
		while (!endline(text[index]))
		{
			while (text[index]===' ') { index++;}
			let k = index;
			while (!separator(text[index])) { index++;}
			if (k !== index)
			{
				words.push(text.substr(k, index-k));
			}
		}
		return words;	
	};

	let nbv = 0;
	let nbfi = 0;
	let nbl = 0;
	let buff_pos = [];
	let buff_norm = [];
	let buff_indices = [];
	let buff_indicesl = [];

	let index = 0;
	let w = read_word();
	let wl = [];
	while (index < text.length)
	{
		switch(w)
		{
		case 'v':
			wl = read_line();
			const p = Vec3(parseFloat(wl[0]),parseFloat(wl[1]),parseFloat(wl[2]));
			buff_pos.push(p);
			nbv++;
		break;
		case 'n':
			wl = read_line();
			const n = Vec3(parseFloat(wl[0]),parseFloat(wl[1]),parseFloat(wl[2]));
			buff_norm.push(p);
		break;
		case 'f':
			wl = read_line();
			let nbe = wl.length;
			nbl += nbe;
			nbfi += 3*(nbe-2);

			for(let j=0; j<nbe; j++)
			{
				let a = parseInt(wl[j])-1;
				let b = parseInt(wl[(j+1)%nbe])-1;
				if (a<b)
				{
					buff_indicesl.push(a);
					buff_indicesl.push(b);
				}
			}
			nbe -= 2;
			for(let j=0; j<nbe; j++)
			{
				buff_indices.push(parseInt(wl[0])-1);
				buff_indices.push(parseInt(wl[j+1])-1);
				buff_indices.push(parseInt(wl[j+2])-1);
			}
		break;
		}
		w = read_word();
	}

	let pos = create_vec3_buffer(nbv);
	let norm = create_vec3_buffer(nbv);

	let indices = create_uint32_buffer(nbfi);
	let indicesl = create_uint32_buffer(nbl);

	buff_pos.forEach(v => { pos.push(v);});
	buff_norm.forEach(n => { norm.push(n);});
	buff_indices.forEach(i => { indices.push(i); });
	buff_indicesl.forEach(i => { indicesl.push(i); });
	
	let m = Object.assign(Object.create(Mesh_ops), {positions:pos, vbo_p:null, 
			normals: norm, vbo_n:null,
			texcoords:null, vbo_t:null,
			tris: indices, lines: indicesl});

	if (buff_norm.length <  buff_pos.length)
	{
		m.compute_normals()
	}

	m.BB = m.compute_BB();
	return m;
},

load(blob)
{
	let reader = new FileReader();
	return new Promise( (resolve, reject) =>
	{
		reader.onerror = () => 
		{
			reader.abort();
			ewgl_console.error('can not load '+blob.name)
			reject();
    	};
		reader.onload = () => 
		{
			if (blob.name.match(/off|OFF$/)) 
			{
				resolve(this.OFF_load(reader.result));
			}
			else if (blob.name.match(/obj|OBJ$/)) 
			{
				resolve(this.OBJ_load(reader.result));
			}
			else
			{
				ewgl_console.error('can not load '+blob.name)
				reject();
			}		
		};
		reader.readAsText(blob);
	});
}

};// end Mesh


//
// INTERFACE
//

let ewgl_console =
{
	cons: document.getElementById("console"),
	contents: ["<div style='color:#00DD00'>" + "Welcome in webGL2 world" + "<br></div>"],
	nb_max_lines : 60,
	hidden : false,

	clear: function()
	{
		this.contents = [""];
		this.cons.innerHTML = this.contents.join();
	},

	rewind: function(n)
	{
		for (let i=0; i<n; ++i)
		{
			this.contents.pop();
		}
	},

	show: function(b=true)
	{
		// if (b)
		// {
		// 	this.hidden = false;
		// 	this.cons.innerHTML = this.contents.join();
		// }
		// else
		// {
		// 	this.hidden = true;
		// 	this.cons.innerHTML = '';
		// }
	},

	hide: function()
	{
		this.show(false);
	},

	set_max_nb_lines: function(nb)
	{
		while (nb<this.contents.length)
		{
			this.contents.shift();
		}
		this.nb_max_lines = nb;
	},

	custom: function(text)
	{
		this.contents.push(text);
		if (this.contents.length > this.nb_max_lines)
		{
			this.contents.shift();
		}
		if (!this.hidden)
		{
			this.cons.innerHTML = this.contents.join('');
		}
	},

	gen: function(pre)
	{
		let param = arguments[1];
		if (param === undefined)
		{
			this.custom("<div style='color:#FF4444'> UNDEFINED <br></div>");
			return;
		}
		if (param.is_matrix)
		{
			switch (param.dim())
			{
				case 2:
				this.gen(pre, param.data[0].toFixed(3)+' '+param.data[2].toFixed(3));
				this.gen(pre, param.data[1].toFixed(3)+' '+param.data[3].toFixed(3));
				break;
				case 3:
				this.gen(pre, param.data[0].toFixed(3)+' '+param.data[3].toFixed(3)+' '+param.data[6].toFixed(3));
				this.gen(pre, param.data[1].toFixed(3)+' '+param.data[4].toFixed(3)+' '+param.data[7].toFixed(3));
				this.gen(pre, param.data[2].toFixed(3)+' '+param.data[5].toFixed(3)+' '+param.data[8].toFixed(3));
				break;
				case 4:
				this.gen(pre, param.data[0].toFixed(3)+' '+param.data[4].toFixed(3)+' '+ param.data[8].toFixed(3)+' '+param.data[12].toFixed(3));
				this.gen(pre, param.data[1].toFixed(3)+' '+param.data[5].toFixed(3)+' '+ param.data[9].toFixed(3)+' '+param.data[13].toFixed(3));
				this.gen(pre, param.data[2].toFixed(3)+' '+param.data[6].toFixed(3)+' '+ param.data[10].toFixed(3)+' '+param.data[14].toFixed(3));
				this.gen(pre, param.data[3].toFixed(3)+' '+param.data[7].toFixed(3)+' '+ param.data[11].toFixed(3)+' '+param.data[15].toFixed(3));
				break;
			}
			return;
		}

		let str= '';
		for (let i=1; i<arguments.length;++i)
		{
			let p=arguments[i];
			if (p && p.is_vector)
			{
				str += '('+p.data + ') ';
			}
			else
			{
				str += JSON.stringify(p) + ' ';
			}
		}

		this.custom(pre + str + "<br></div>");
		this.cons.scrollTop = this.cons.scrollHeight;
	},


	info: function()
	{
		this.gen("<div style='color:#00DD00'>", ...arguments);
	},

	warning: function()
	{
		if (!console_on_off)
		{
			console_on_off = true;
			ui_resize();
		}
		this.gen("<div style='color:#DDDD00'>", ...arguments);
	},

	error: function()
	{
		if (!console_on_off)
		{
			console_on_off = true;
			ui_resize();
		}
		this.gen("<div style='color:#FF4444'>", ...arguments);
	},
};

function ewgl_rgb_color(col)
{
	let r1=col.charCodeAt(1)-87;
	let r2=col.charCodeAt(2)-87;
	let r = 16 * ((r1<0)?(r1+39):r1) + ((r2<0)?(r2+39):r2);

	let g1=col.charCodeAt(3)-87;
	let g2=col.charCodeAt(4)-87;
	let g = 16 * ((g1<0)?(g1+39):g1) + ((g2<0)?(g2+39):g2);

	let b1=col.charCodeAt(5)-87;
	let b2=col.charCodeAt(6)-87;
	let b = 16 * ((b1<0)?(b1+39):b1) + ((b2<0)?(b2+39):b2);

	ewgl_console.info(r,g,b, Vec3(r,g,b));
	return Vec3(r,g,b);
}

function set_widget_color(node,col,bg)
{
	if (node.parentNode.className === 'FieldSetBorder')
	{
		node.parentNode.style['border-color'] = col;
		node.parentNode.style['color'] = col;
		node.parentNode.style['background'] = bg;
	}
	else if (node.style)
	{
		node.style['border-color'] = col;
		node.style['color'] = col;
		node.style['background'] = bg;
	}
}


const UserInterface = 
{
	interf: null,
	par: [],
	dir:['V'],

	parent: function()
	{
		return this.par[this.par.length-1];
	},

	set_width: function(w)
	{
		ui_width_interf = w;
	},

	adjust_width()
	{
		let ch = this.interf.childNodes;
		let m = 0;
		for(let i=0; i<ch.length;++i)
		{
			if (ch[i].nodeName !== 'HR')
			{
				let w = ch[i].offsetWidth;
				if (w>m)
				{
					m = w;
				}
			}
		}
		ui_width_interf = m + 12;
		ui_resize();
	},

	begin: function(shader_editor=true)
	{
		interface_on_off = true;
		this.interf = document.getElementById("Interface");
		this.par.length=0;
		this.par.push(this.interf);
		while (this.interf.lastChild)
		{
			this.interf.removeChild(this.interf.lastChild);
		}
		ewgl_code_editors.length = 0;
		if (shader_editor)
		{
			this.add_shader_editor_selector();
		}
	},

	add_br: function()
	{
		if (this.dir[this.dir.length-1] === 'V')
		{
			this.parent().appendChild(document.createElement("br"));
		}
	},

	add_hspace: function(nb=1)
	{
		let t = document.createElement("div");
		t.style.width = 10*nb+'px';
		t.style.height='auto';
		t.style.display='inline-block';
		this.parent().appendChild(t);
	},

	add_label: function(label)
	{
		let sp = document.createElement("span");
		let noB = document.createElement("b");
		let lab = document.createTextNode(label);
		noB.appendChild(lab);
		sp.appendChild(noB);
		this.parent().appendChild(sp);
		this.add_br();
		return sp;
	},

	add_group: function()
	{
		let fs = document.createElement("div");
		fs.style.display='inline';
		this.parent().appendChild(fs);
		this.add_br();
		return fs;
	},

	use_group: function(d)
	{
		let g = this.add_group();
		this.par.push(g);
		this.dir.push(d);
		return g;
	},

	add_field_set: function(label, bwidth='1.5px', color='#000000', bgcol='#ffffff', fw='normal')
	{
		let fs = document.createElement("fieldset");
		fs.className ='FieldSetBorder';
		this.parent().appendChild(fs);
		this.add_br();

		let la = document.createElement("legend");
		la.innerText = label;
		
		fs.appendChild(la);

		fs.style['border-width'] = bwidth;
		fs.style['border-color'] = color;
		fs.style.background = bgcol;
		la.style.color = color;
		la.style['font-weight'] = fw;

		return fs;
	},

	use_field_set: function(d,label, bwidth='1.5px', color='#000000', bgcol='#ffffff', fw='normal')
	{
		let f = this.add_field_set(label, bwidth, color, bgcol, fw);
		this.par.push(f);
		this.dir.push(d);
		return f;
	},

	end_use: function()
	{
		if (this.par.length>1)
		{
			this.par.pop();
			this.dir.pop();
		}
	},

	add_slider: function(label, min, max, val, func, func_val, dec=2)
	{
		let fs = document.createElement("fieldset");
		fs.className ='FieldSetBorder';
		this.parent().appendChild(fs);
		this.add_br();

		let la = document.createElement("legend");
		la.innerText = label;
		fs.appendChild(la);

		let sl = document.createElement("input");
		sl.type="range";
		sl.min=min;
		sl.max=max;
		sl.value=val;
		sl.id = make_unique_id();
		fs.appendChild(sl);

		if (typeof func !== "function")
		{
			func = () => {};
		}

		if (typeof func_val !== "function")
		{
			func_val = v => v;
			sl.oninput = () => { func(sl.value);}
		}
		else
		{
			let lm = Math.trunc(func_val(max)).toString().length;
			if (dec>0)
			{
				lm += dec+1;
			}
			let leftJustify = (str) => {let res = ' '.repeat(lm - str.length) + str; return res;};
			let conv = v => leftJustify(parseFloat(v).toFixed(dec));
			let va_la = document.createElement("label");
			va_la.Htmlfor = sl.id;
			va_la.innerText = conv(func_val(sl.value));
			fs.appendChild(va_la);
			sl.oninput = () => { func(sl.value); va_la.innerText = conv(func_val(sl.value));}
			sl.easy_value=function() {return func_val(sl.value);}
		}
		return sl;
	},

	add_check_box: function(label, val, func)
	{
		let fs = document.createElement("fieldset");
		fs.className ='FieldSetBorder';
		this.parent().appendChild(fs);
		this.add_br();

		let cb = document.createElement("input");
		cb.type="checkbox";
		cb.checked=val;
		
		let la = document.createElement("label");
		la.Htmlfor = cb.id;
		la.innerText = label;
		fs.appendChild(la);
		fs.appendChild(cb);
		cb.onclick = () => {func(cb.checked);};
		return cb;
	},

	add_radio: function(d,title, labels, val, func)
	{
		let fs = this.use_field_set(d,title);

		let sel = ewgl_make_ref(0);
		let rads = [];
		let name = '';
		labels.forEach( l => {name += l;});
		name.replace(" ","");
		for (let i=0; i<labels.length; i++)
		{
			let ra = document.createElement("input");
			ra.type="radio";
			ra.name=name;
			if (val===i)
			{
				ra.checked = "checked";
			}
			ra.id = make_unique_id();
			let la = document.createElement("label");
			la.Htmlfor = ra.id;
			la.innerText = labels[i];
			fs.appendChild(la);
			fs.appendChild(ra);
			if (d==='H') { this.add_hspace();}
			else {this.add_br ();}
			ra.onclick = ()=> { sel.value = i; func(i); };
			rads.push(ra);
		}
		this.end_use();
		return sel;
	},

	add_shader_edit: function(prg)
	{
		let compil_func = () => 
		{
			ewgl_console.info('Compilation de '+prg.sh_name);
			if (prg.compile())
			{
				ewgl_console.info(prg.sh_name + ' : compilation OK');
			}
			update_wgl();
		};

		CodeMirror.commands.autocomplete = function(cm) 
		{
			cm.showHint({hint: CodeMirror.hint.anyword});
		}

		let fs = this.use_field_set('V','', '3px', '#000000', '#606060', 'bold');
		fs.id = 'sh_ed';
		let lab = this.add_label(prg.sh_name +'.vert');
		lab.style.color='#ffffff';
		let first_node = this.interf.lastChild.previousSibling; // b node

		let code_edit_v = CodeMirror(fs,{ value:prg.v_src,
			theme: "monokai", 
			mode: "text/x-glsl-es3",
			indentUnit: 4,
			lineNumbers: true,
			indentWithTabs: true,
			matchBrackets: true,
//			comment: true,
			extraKeys: {"Ctrl-Space": "autocomplete"},
		});
		ewgl_code_editors.push(code_edit_v);

		let code_edit_f = null;
		if (prg.f_src)
		{
			lab = this.add_label(prg.sh_name +'.frag');
			lab.style.color='#ffffff';
			code_edit_f = CodeMirror(fs,{ value:prg.f_src,
				theme: "monokai",
				mode: "text/x-glsl-es3",
				indentUnit: 4,
				lineNumbers: true,
				indentWithTabs: true,
				matchBrackets: true,
//				comment: true,
				extraKeys: {"Ctrl-Space": "autocomplete"},
			});

			ewgl_code_editors.push(code_edit_f);
		}
		else
		{
			lab = this.add_label('no fragment');
			lab.style.color='#ffffff';;
		}

		let foc;
		code_edit_v.on('focus', () => {	foc = code_edit_v;});
		code_edit_f.on('focus', () => {	foc = code_edit_f;});

		this.use_group('H');

		this.add_button('compile', () => { 
			prg.v_src = code_edit_v.getValue();
			if (prg.f_src)
			{
				prg.f_src = code_edit_f.getValue();
			}
			compil_func(); });

		this.add_hspace(4);
		let fname = this.add_text_input(prg.sh_name)
		this.add_button('save', () => { 
			save_text(code_edit_v.getValue(), fname.value + ".vert");
			save_text(code_edit_f.getValue(), fname.value + ".frag");});
		this.add_hspace(2);

		let uname = this.add_text_input('');

		let li = this.add_list_input(['+U','float','vec2','vec3','vec4'], 0, () => {
			switch (li.value) {
				case '1':
					foc.getDoc().replaceRange('uniform float '+uname.value+'; \n',foc.getCursor());
					let sl = this.add_slider(uname.value,0,100,0, () => 
					{
						prg.bind();
						update_uniform(uname.value,sl.value*0.01);
						unbind_shader();
						update_wgl();
					});
					break;
				case '2':{
					foc.getDoc().replaceRange('uniform vec2 '+uname.value+'; \n',foc.getCursor());
					let f = () => {
						prg.bind();
						update_uniform(uname.value,sl1.value*0.01,sl2.value*0.01);
						unbind_shader();
						update_wgl();
					};
					this.use_field_set('H',uname.value);
					let sl1 = this.add_slider('',0,100,50, f);
					let sl2 = this.add_slider('',0,100,50, f);
					this.end_use();
				}break;
				case '3':{
					foc.getDoc().replaceRange('uniform vec3 '+uname.value+'; \n',foc.getCursor());
					let f = () => {
						prg.bind();
						update_uniform(uname.value,sl1.value*0.01,sl2.value*0.01,sl3.value*0.01);
						unbind_shader();
						update_wgl();
					};
					this.use_field_set('H',uname.value);
					let sl1 = this.add_slider('',0,100,50, f);
					let sl2 = this.add_slider('',0,100,50, f);
					let sl3 = this.add_slider('',0,100,50, f);
					this.end_use();
				}break;
				case '4':{
					foc.getDoc().replaceRange('uniform vec4 '+uname.value+'; \n',foc.getCursor());
					let f = () => {
						prg.bind();
						update_uniform(uname.value,sl1.value*0.01,sl2.value*0.01,sl3.value*0.01,sl4.value*0.01);
						unbind_shader();
						update_wgl();
					};
					this.use_field_set('H',uname.value);
					let sl1 = this.add_slider('',0,100,50, f);
					let sl2 = this.add_slider('',0,100,50, f);
					let sl3 = this.add_slider('',0,100,50, f);
					let sl4 = this.add_slider('',0,100,50, f);
					this.end_use();
				}break;
			default:
					break;
			}
			li.value = 0;
		});

		/*
		this.add_button('+U', () => {
			foc.getDoc().replaceRange('uniform float '+uname.value+'; \n',foc.getCursor());
			let sl = this.add_slider(uname.value,0,100,0, () => 
			{
				prg.bind();
				update_uniform(uname.value,sl.value*0.01);
				unbind_shader();
				update_wgl();
			});
		});
		this.add_button('+Uv3', () => {
			foc.getDoc().replaceRange('uniform vec3 '+uname.value+'; \n',foc.getCursor());
			let f = () => 
			{
				prg.bind();
				update_uniform(uname.value,sl1.value*0.01,sl2.value*0.01,sl3.value*0.01);
				unbind_shader();
				update_wgl();
			};
			this.use_field_set(uname.value);
			let sl1 = this.add_slider('',0,100,50, f);
			let sl2 = this.add_slider('',0,100,50, f);
			let sl3 = this.add_slider('',0,100,50, f);
			this.end_use();

		})*/
		this.add_hspace(4);

		this.add_button('X', () => {
			this.interf.removeChild(fs.nextSibling);
			this.interf.removeChild(fs);
			ewgl_code_editors.pop();
			if (prg.f_src)
			{
				ewgl_code_editors.pop();
			}
			this.adjust_width();
		}); 
		this.end_use();
		this.end_use();
		let last_node = this.interf.lastChild;
	},


	add_shader_editor_selector: function()
	{
		let li = this.add_list_input( () => {
			let l = ['edit shader'];
			for (let i=0; i<ewgl_prg_list.length; ++i)
			{
				l.push(ewgl_prg_list[i].sh_name);
			}
			return l; }
		,0, () => {
			let i = li.value - 1;
			if (i>=0)
			{
				this.add_shader_edit(ewgl_prg_list[i]);
			}
			li.value = 0;
			this.adjust_width();
		});
		this.add_br();
	},

	add_button: function(label, func)
	{
		let b = document.createElement("button");
		b.type="button";
		b.onclick = func;
		b.innerText = label;
		this.parent().appendChild(b);
		this.add_br();
		return b;
	},

	add_text_input: function(text)
	{
		let inptext = document.createElement("input");
		inptext.type="text";
		inptext.value=text;
		inptext.id = make_unique_id();
		this.parent().appendChild(inptext);
		this.add_br();
		return inptext;
	},
	
	add_list_input: function(items, i, func)
	{
		let fs = document.createElement("fieldset");
		fs.className ='FieldSetBorder';
		this.parent().appendChild(fs);
		this.add_br();

		let sel = fs.appendChild(document.createElement('select'));

		if (typeof items === 'function')
		{
			sel.onfocus = () =>
			{
				while(sel.childElementCount !== 0)
				{
					sel.removeChild(sel.lastChild);
				}
				let its = items();
				for (let i=0; i< its.length; ++i)
				{
					let option = sel.appendChild(document.createElement('option'));
					option.value = i;
					option.text = its[i];
				}

			};

			sel.onfocus();

		}
		else
		{
			for (let i=0; i< items.length; ++i)
			{
				let option = sel.appendChild(document.createElement('option'));
				option.value = i;
				option.text = items[i];
			}
		}
		sel.value=i;
		sel.onchange = () => func(sel.value,sel.text);
		return sel;
	},

};


const canv_cons_elt = document.getElementById("canv_cons");
const div_interf_elt = document.getElementById("div_interf");
const interf_elt = document.getElementById("Interface");
const canvas = document.getElementById("canvas");
const ui_vsep_elt = document.getElementById("vsep");
const ui_hsep_elt = document.getElementById("hsep");

const gl = canvas.getContext("webgl2");
var ewgl_code_editors = [];

const gl_type_of_array = new Map([['Float32Array',gl.FLOAT],
	['Uint32Array',gl.UNSIGNED_INT],['Int32Array',gl.INT],
	['Uint16Array',gl.UNSIGNED_SHORT],['Int16Array',gl.SHORT],
	['Uint8Array',gl.UNSIGNED_BYTE],['Int8Array',gl.BYTE]]);


let MouseManipulator2D_ops =
{
	init()
	{
		canvas.addEventListener('contextmenu', ev =>
		{
			ev.preventDefault();
			ev.stopImmediatePropagation();
		});

		canvas.addEventListener('dblclick', ev =>
		{
			ev.preventDefault();
			ev.stopImmediatePropagation();
			if (typeof mousedblclick_wgl === 'function')
			{
				mousedblclick_wgl(ev);
			}
		});

		canvas.addEventListener('mousedown', ev =>
		{
			ev.preventDefault();
			ev.stopImmediatePropagation();

			if (ev.clientX > canvas.clientWidth-15)
			{
				let p = ev.clientY /  canvas.clientHeight;
				if (p<0.1)
				{
					toggle_interface();
						return;
				}
			}
			if (ev.clientY > canvas.clientHeight-15)
			{
				let p = ev.clientX /  canvas.clientWidth;
				if (p<0.1)
				{
					toggle_console();
					return;
				}
			}
			this.button = ev.button;
			if (typeof mousedown_wgl === 'function')
			{
				mousedown_wgl(ev);
			}
		});
	
		canvas.addEventListener('mouseup', ev =>
		{
			if (typeof mouseup_wgl === 'function')
			{
				mouseup_wgl(ev);
			}
		});

		canvas.addEventListener('mousemove',   ev =>
		{
			if (ev.buttons === 0)
			{
				return;
			}

			if (typeof mousemove_wgl === 'function')
			{
				mousemove_wgl(ev);
			}
		});
	
		canvas.addEventListener('wheel', ev =>
		{
			ev.stopImmediatePropagation();
			if (typeof mousewheel_wgl === 'function')
			{
				mousewheel_wgl(ev);
			}

		},{passive:true});


		ui_vsep_elt.addEventListener('mousedown', ev =>
		{
			this.console_move = true;
		});
		ui_hsep_elt.addEventListener('mousedown', ev =>
		{
			this.interf_move = true;
		});

		window.addEventListener('mouseup', ev =>
		{
			this.console_move = false;
			this.interf_move = false;
		});

		window.addEventListener('mousemove', ev =>
		{
			if (ev.buttons !== 0)
			{
				if (this.console_move)
				{
					ev.preventDefault();
					ev.stopImmediatePropagation();
					ui_height_cons -= ev.movementY;
					ui_resize();
				}
				if (this.interf_move)
				{
					ev.preventDefault();
					ev.stopImmediatePropagation();
					ui_width_interf -= ev.movementX / window.devicePixelRatio;
					ui_resize();
				}
			}
		});
	}
}


function MouseManipulator2D()
{
	let o = Object.assign(Object.create(MouseManipulator2D_ops), {interf_move:false,console_move:false});
	o.init();
	return o;
}

var internal_update_wgl_needed = true;

let MouseManipulator3D_ops =
{
	set_camera: function(c)
	{
		this.camera = c;
		this.inv_cam = null;
		this.obj = null;
	},

	manip: function(obj)
	{
		this.obj = obj;
		this.inv_cam = this.camera.frame.inverse();	
	},

	init()
	{
		canvas.addEventListener('contextmenu', ev =>
		{
			ev.preventDefault();
			ev.stopImmediatePropagation();
		});

		canvas.addEventListener('dblclick', ev =>
		{
			ev.preventDefault();
			ev.stopImmediatePropagation();
			this.button = ev.button;
			if (ev.button === 0)
			{
				this.speed = 0;
				if (this.obj)
				{
					this.spin_set.delete(this.obj);
					this.obj.frame.realign();
				}
				else
				{
					this.spin_set.delete(this.camera);
					this.camera.frame.realign();
				}
			}

			// if (this.spin_set.size == 0)
			// {
			// 	update_wgl();
			// }

			if (typeof mousedblclick_wgl === 'function')
			{
				mousedblclick_wgl(ev);
			}
			internal_update_wgl_needed = true;
		});

		canvas.addEventListener('mousedown', ev =>
		{
			ev.preventDefault();
			ev.stopImmediatePropagation();

			if (ev.clientX > canvas.clientWidth-15)
			{
				let p = ev.clientY /  canvas.clientHeight;
				if (p<0.1)
				{
					toggle_interface();
				}
			}
			if (ev.clientY > canvas.clientHeight-15)
			{
				let p = ev.clientX /  canvas.clientWidth;
				if (p<0.1)
				{
					toggle_console();
				}
			}

			this.button = ev.button;
			if (ev.button === 0)
			{
				this.speed = 0;
				if (this.obj)
				{
					this.spin_set.delete(this.obj);
				}
				else
				{
					this.spin_set.delete(this.camera);
				}
			}

			// if (this.spin_set.size == 0)
			// {
			// 	update_wgl();
			// }
			if (typeof mousedown_wgl === 'function')
			{
				mousedown_wgl(ev);
			}
			internal_update_wgl_needed = true;
		});
	
		canvas.addEventListener('mouseup', ev =>
		{
			if ((ev.button !== 0))
			{
				return;
			}
			this.interf_move = false;
			this.console_move = false;
			this.button = -1;
			if (this.speed > 0.05)
			{
				if (this.obj)
				{
					this.spin_set.add(this.obj);
				}
				else
				{
					this.spin_set.add(this.camera);
				}
			}
			else
			{
				if (this.obj)
				{
					this.spin_set.delete(this.obj);
				}
				else
				{
					this.spin_set.delete(this.camera);
				}
			}
			if (typeof mouseup_wgl === 'function')
			{
				mouseup_wgl(ev);
			}
			internal_update_wgl_needed = true;
		});

		canvas.addEventListener('mousemove',   ev =>
		{
			const cam = this.camera;
			if (ev.buttons === 0)
			{
				return;
			}

			if (this.interf_move)
			{
				ui_width_interf -= ev.movementX*100/window.innerWidth/window.devicePixelRatio;
				ui_resize();
				return;
			}
			if (this.console_move)
			{
				ui_height_cons -= ev.movementY*100/window.innerHeight/window.devicePixelRatio;
				ui_resize();
				return;
			}

			this.axis.copy(Vec3(ev.movementY,ev.movementX,0));
			this.speed = this.axis.norm()*0.1;
			if (this.speed==0)
			{
				return;
			}

			if (this.obj)
			{
				switch(this.button)
				{
				case 0:
					const sm = rotate(2*this.speed,this.axis);
					this.obj.spin_matrix = this.inv_cam.mult(sm).mult(cam.frame);
					this.obj.frame = this.obj.frame.pre_mult3(this.obj.spin_matrix);
					break;
				case 2:
					const a = 1.0 - cam.frame.data[14]/cam.zcam/cam.s_radius
					let tx = 1 * ev.movementX / gl.canvas.clientWidth * cam.width * cam.s_radius*a;
					let ty = - 1 * ev.movementY / gl.canvas.clientHeight * cam.height * cam.s_radius*a;
					let ntr = this.inv_cam.mult(translate(tx,ty,0)).mult(cam.frame);
					this.obj.frame = ntr.mult(this.obj.frame);
					break;
				}
			}
			else
			{
				switch(this.button)
				{
				case 0:
					cam.spin_matrix = rotate(0.2*this.speed,this.axis);
					cam.frame = cam.frame.pre_mult3(rotate(this.speed,this.axis));
					break;
				case 2:
					const a = 1.0 - cam.frame.data[14]/cam.zcam/cam.s_radius
					let nx = 1 * ev.movementX / gl.canvas.clientWidth * cam.width * cam.s_radius*a;
					let ny = - 1 * ev.movementY / gl.canvas.clientHeight * cam.height * cam.s_radius*a;
					cam.frame.data[12] += nx;
					cam.frame.data[13] += ny;
					break;
				}
			}
			// if (this.spin_set.size == 0)
			// {
			// 	update_wgl();
			// }
			if (typeof mousemove_wgl === 'function')
			{
				mousemove_wgl(ev);
			}
			internal_update_wgl_needed = true;
		});
	
		canvas.addEventListener('wheel', ev =>
		{
			const cam = this.camera;
			ev.stopImmediatePropagation();
			if (ev.deltaY!=0)
			{
				const delta = ev.deltaMode===0?ev.deltaY:50*ev.deltaY;
				if (this.obj)
				{
					let ntr = this.inv_cam.mult(translate(0,0,0.0025*delta)).mult(cam.frame);
					this.obj.frame = ntr.mult(this.obj.frame);
				}
				else
				{
					const a = 1.0 - cam.frame.data[14]/cam.zcam/cam.s_radius;
					let ntr = 0.0025*delta*a;
					cam.frame.data[14] += ntr * cam.s_radius;
				}
				if (typeof mousewheel_wgl === 'function')
				{
					mousewheel_wgl(ev);
				}
			}
			internal_update_wgl_needed = true;
		},{passive:true});


		ui_vsep_elt.addEventListener('mousedown', ev =>
		{
			this.console_move = true;
		});
		ui_hsep_elt.addEventListener('mousedown', ev =>
		{
			this.interf_move = true;
		});

		window.addEventListener('mouseup', ev =>
		{
			this.console_move = false;
			this.interf_move = false;
		});

		window.addEventListener('mousemove', ev =>
		{
			if (ev.buttons !== 0)
			{
				if (this.console_move)
				{
					ev.preventDefault();
					ev.stopImmediatePropagation();
					ui_height_cons -=  ev.movementY/window.devicePixelRatio;;
					ui_resize();
				}
				if (this.interf_move)
				{
					ev.preventDefault();
					ev.stopImmediatePropagation();
					ui_width_interf -= ev.movementX/window.devicePixelRatio;;
					ui_resize();
				}
			}
		});
	}
}


function MouseManipulator3D(cam)
{
	let button = -1;
	let axis = Vec3(0,0,1);
	let speed = 0;
	let camera = cam;
	let obj = null;
	let inv_cam = null;
	let is_spinning = false;
	let zoom = 1.0;
	let spin_set = new Set();
	let func_timer = null;
	let interv = null;
	let o = Object.assign(Object.create(MouseManipulator3D_ops), {button,interv,axis,speed,camera,inv_cam,obj,zoom,spin_set});
	o.init();
	return o;
}


let Camera_ops = 
{
	set_scene_radius: function(r)
	{
		this.s_radius = r;
	},

	set_scene_center: function(c)
	{
		this.s_center = c;
	},

	set_aspect: function(asp)
	{
		this.aspect = asp;
		if (asp > 1)
		{
			this.width = asp;
			this.height = 1;
		}
		else
		{
			this.width = 1;
			this.height = 1/asp;
		}
	},

	set_fov: function(f)
	{
		this.fov = f*Math.PI/180;
		this.zcam = 1.0/(Math.tan(this.fov));
	},

	get_projection_matrix: function()
	{
		const d = this.zcam*this.s_radius - this.frame.data[14];
		const znear = Math.max(0.001,d-this.s_radius);
		const zfar = d+this.s_radius;
		return perspective(this.fov,this.aspect,znear,zfar);
	},

	get_view_matrix: function()
	{
		return translate(0,0,-this.zcam*this.s_radius).mult(this.frame).mult(translate(-this.s_center.x,-this.s_center.y,-this.s_center.z));
	},

	show_scene: function()
	{
		if (arguments.length === 2)
		{
			this.s_center = arguments[0]; 
			this.s_radius = arguments[1];
		}
		if (arguments.length === 1)
		{
			this.s_center = arguments[0].center; 
			this.s_radius = arguments[0].radius;
		}
		this.frame.data[12] = 0;
		this.frame.data[13] = 0;
		this.frame.data[14] = 0;

		update_wgl();
	},

}

function Camera(pcenter,pradius,pfov,asp)
{
	let s_center = pcenter || Vec3(0);
	let s_radius = pradius || 1;
	let fov = pfov || 45*Math.PI/180;
	let aspect = asp || 1;
	let zcam = 1.0/(Math.tan(fov/2));

	let frame = Mat4();
	let width = 1;
	let height = 1;
	if (aspect > 1)
	{
		width *= aspect;
	}
	else
	{
		height /= aspect;
	}
	return Object.assign(Object.create(Camera_ops),
	{s_center, s_radius, aspect, fov, zcam, frame, width, height, is_camera_type:true});
}


function init_scene3d()
{
	scene_camera = Camera();
	scene_camera.set_aspect( gl.canvas.clientWidth/ gl.canvas.clientHeight);
	scene_manip = MouseManipulator3D(scene_camera);
}

var scene_camera = null;
var scene_manip = null;
var mouse_manip = null;
var ewgl_continuous_update = false;

// function TextFileDroppedOnCanevas(func)
// {
// 	canvas.addEventListener("dragenter", e => 
// 	{
// 		e.stopPropagation();
// 		e.preventDefault();
// 	}, false);

// 	canvas.addEventListener("dragover",  e => 
// 	{
// 		e.stopPropagation();
// 		e.preventDefault();
// 	}, false);

// 	canvas.addEventListener("drop", e =>
// 	{
// 		e.stopPropagation();
// 		e.preventDefault();
// 		const dt = e.dataTransfer;
// 		const files = dt.files;
// 		let reader = new FileReader();
// 		reader.onload = () => {	func(files[0].name,reader.result); };
// 		reader.readAsText(files[0]);
// 	 }, false);
// }

function FileDroppedOnCanevas(func)
{
	canv_cons_elt.addEventListener("dragenter", e => 
	{
		e.stopPropagation();
		e.preventDefault();
	}, false);

	canv_cons_elt.addEventListener("dragover",  e => 
	{
		e.stopPropagation();
		e.preventDefault();
	}, false);

	canv_cons_elt.addEventListener("drop", e =>
	{
		e.stopPropagation();
		e.preventDefault();
		const dt = e.dataTransfer;
		const files = dt.files;
		func(files[0]);
	 }, false);
}

function make_unique_id()
{
	return 'id_' + Math.random().toString(36).substr(2, 9);
}


function save_text(text, filename)
{
	let bytes = new Uint8Array(text.length);
	for (let i = 0; i < text.length; i++) 
	{
		bytes[i] = text.charCodeAt(i);
	}

	saveAs( new Blob([bytes]), filename );
}


var ewgl_current_time = null;
var ts_start = null;

function update_wgl()
{
	internal_update_wgl_needed = true;
}

function internal_update_wgl()
{
	requestAnimationFrame( (ts) => 
	{
		const progress = ts - ts_start;
		ewgl_current_time += progress/1000.0;
		ts_start = ts;

		if (scene_manip)
		{
			scene_manip.spin_set.forEach((o) =>
			{
				o.frame = o.frame.pre_mult3(o.spin_matrix);
				internal_update_wgl_needed = true;
			});
		}

		if (internal_update_wgl_needed || ewgl_continuous_update)
		{
			internal_update_wgl_needed = false;
			if (ProcessImage.on)
			{
				ProcessImage.begin(); draw_wgl(); ProcessImage.end();
			}
			else
			{
				draw_wgl();
			}
			internal_update_wgl_needed = false;
		}
		internal_update_wgl();
	});
}

var ortho2D = Mat4();
var console_on_off = false;
var interface_on_off = false;
var ewgl_subsample = 1;
var ui_width_interf = 200;
var ui_height_cons = 300;

function internal_ui_resize_common()
{
	ewgl_console.show(console_on_off);
	if (console_on_off &&  ui_height_cons > 0)
	{
		ewgl_console.cons.style.height = ui_height_cons+'px';
		ewgl_console.cons.style['z-index'] = 2;
		canvas.style.height = window.innerHeight - 6 - ui_height_cons+'px';
		canvas.style['z-index'] = 1;
		ui_vsep_elt.style.display = 'block';
		ui_vsep_elt.style.top = canvas.style.height;
	}
	else
	{
		ewgl_console.cons.style.height ='O%';
		ewgl_console.cons.style['z-index'] = -2;
		canvas.style.height = '100%';
		canvas.style['z-index'] = 2;
		ui_vsep_elt.style.display = 'none';
	}
	
	if (interface_on_off && ui_width_interf > 0)
	{
		canv_cons_elt.style.width = window.innerWidth - 6 - ui_width_interf +'px';
		div_interf_elt.style.width = ui_width_interf+'px';
		div_interf_elt.style.display = 'block';
		interf_elt.style.display = 'block';
		ui_hsep_elt.style.display = 'block';
		ui_hsep_elt.style.left = canv_cons_elt.style.width;
	}
	else
	{
		canv_cons_elt.style.width = '100%';
		div_interf_elt.style.width = '0%';
		div_interf_elt.style.display = 'none';
		interf_elt.style.display = 'none';
		ui_hsep_elt.style.display = 'none';
	}

	gl.canvas.width  = gl.canvas.clientWidth * window.devicePixelRatio / ewgl_subsample;
	gl.canvas.height = gl.canvas.clientHeight * window.devicePixelRatio / ewgl_subsample;
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}


function resize_update_wgl()
{
	if (ProcessImage.on)
	{
		ProcessImage.fbo1.resize(gl.canvas.width, gl.canvas.height);
	}
	if (init_wgl_ok && typeof resize_wgl === "function")
	{
		resize_wgl(gl.canvas.width, gl.canvas.height);
	}
	ts_start = performance.now();
	update_wgl()
}

function ui_resize_2d()
{
	internal_ui_resize_common();

	const aspect = gl.canvas.height / gl.canvas.width;

	ortho2D.data[0] = aspect<1 ? aspect : 1;
	ortho2D.data[5] = aspect<1 ? 1 : 1/aspect;

	resize_update_wgl();
}


function ui_resize_3d()
{
	internal_ui_resize_common();
	
	const aspect = gl.canvas.width / gl.canvas.height;
	scene_camera.set_aspect(aspect);

	resize_update_wgl();
}


function restore_viewport()
{
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

function set_subsampling(s=1)
{
	ewgl_subsample = s;
	gl.canvas.width  = gl.canvas.clientWidth * window.devicePixelRatio / ewgl_subsample;
	gl.canvas.height = gl.canvas.clientHeight * window.devicePixelRatio / ewgl_subsample;
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	resize_update_wgl();
}

var init_wgl_ok = false;
var ui_resize = null;
var scripts_to_load = [];

function launch_3d()
{
	ewgl_path = ewgl_get_path();
	loadRequiredFiles( [ ewgl_add_path(["easy_wgl/codemirror.css","easy_wgl/theme/monokai.css","easy_wgl/addon/hint/show-hint.css","easy_wgl/easy_wgl.css"]),
		ewgl_add_path(["easy_wgl/codemirror.js","easy_wgl/FileSaver.js"]),
		ewgl_add_path(["easy_wgl/addon/edit/matchbrackets.js","easy_wgl/addon/comment/comment.js","easy_wgl/addon/hint/show-hint.js","easy_wgl/addon/hint/anyword-hint.js","easy_wgl/mode/clike/clike.js"]),
		ewgl_add_path(scripts_to_load)], () =>
		{
			ui_resize = ui_resize_3d;
			ewgl_current_time = 0.0;
			init_scene3d();
			init_wgl();
			init_wgl_ok = true;
			mouse_manip = scene_manip;
			document.body.onresize = () => {ui_resize_3d();update_wgl();};
			ui_resize_3d();
			internal_update_wgl();
			ewgl_console.info("WebGL2 context OK");
			const gldebugInfo = gl.getExtension('WEBGL_debug_renderer_info');
			if (gldebugInfo)
			{
				ewgl_console.info('Vendor: '+ gl.getParameter(gldebugInfo.UNMASKED_VENDOR_WEBGL));
				ewgl_console.info('Renderer: '+ gl.getParameter(gldebugInfo.UNMASKED_RENDERER_WEBGL));	
			}
		});
}


function launch_2d()
{
	ewgl_path = ewgl_get_path();
	loadRequiredFiles( [ ewgl_add_path(["easy_wgl/codemirror.css","easy_wgl/theme/monokai.css","easy_wgl/addon/hint/show-hint.css","easy_wgl/easy_wgl.css"]),
		ewgl_add_path(["easy_wgl/codemirror.js","easy_wgl/FileSaver.js"]),
		ewgl_add_path(["easy_wgl/addon/edit/matchbrackets.js","easy_wgl/addon/comment/comment.js","easy_wgl/addon/hint/show-hint.js","easy_wgl/addon/hint/anyword-hint.js","easy_wgl/mode/clike/clike.js"]),
		ewgl_add_path(scripts_to_load)], () =>
		{
			ui_resize = ui_resize_2d;
			mouse_manip = MouseManipulator2D();
			init_wgl();
			init_wgl_ok = true;
			document.body.onresize = () => {ui_resize_2d();update_wgl();};
			ui_resize_2d();
			internal_update_wgl();
			ewgl_console.info("WebGL2 context OK");
			const gldebugInfo = gl.getExtension('WEBGL_debug_renderer_info');
			if (gldebugInfo)
			{
				ewgl_console.info('Vendor: '+ gl.getParameter(gldebugInfo.UNMASKED_VENDOR_WEBGL));
				ewgl_console.info('Renderer: '+ gl.getParameter(gldebugInfo.UNMASKED_RENDERER_WEBGL));	
			}
		});
}

function load_and_run(s)
{
	let script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = s;
	document.body.appendChild(script);
}


function toggle_console(c)
{
	if (c===undefined)
	{
		c = !console_on_off;
	}
	console_on_off = c;
	ui_resize();
}

function toggle_interface(i)
{
	if (i===undefined)
	{
		i = !interface_on_off;
	}
	interface_on_off = i
	ui_resize();
}

document.onkeydown = ev =>
{
	let foc = false;
	ewgl_code_editors.forEach( e =>
	{
		foc |= e.hasFocus();
	});

	if ( !foc && typeof onkey_wgl === "function")
	{
		if (onkey_wgl(ev.key))
		{
			ev.preventDefault();
			ev.stopImmediatePropagation();
		}
	}	
}

let ProcessImage = 
{

	fbo1:null, tex1:null, prg_fs:null,
	a:0, b:1, c:1,
	fs:null,
	on:false,

fullscreen_vert:
`#version 300 es
out vec2 tc;
void main()
{
	uint ID = uint(gl_VertexID);
	tc = vec2((ID%2u)*2u, (ID/2u)*2u);
	vec2 p = tc*2.0 - 1.0;
	gl_Position = vec4(p, 0.9999, 1);
}
`,
fullscreen_frag : `#version 300 es
precision highp float;
uniform highp sampler2D TU0;
uniform float a;
uniform float b;
uniform float c;
in vec2 tc;
out vec4 frag_out;

void main()
{
	frag_out = vec4(vec3(a) + b*vec3(pow(texture(TU0,tc).r,c),pow(texture(TU0,tc).g,c),pow(texture(TU0,tc).b,c)),1.0);
}`,

enable: function()
{
	if (this.on) { return; }
	this.prg_fs = ShaderProgram(this.fullscreen_vert,this.fullscreen_frag,'post_process');
	this.tex1 = Texture2d();
	this.tex1.alloc(0,0, gl.RGB8);
	this.fbo1 = FBO(this.tex1,true);
	this.on = true;
},

begin: function()
{
	this.fbo1.bind();
	gl.viewport(0,0,this.fbo1.w,this.fbo1.h);
},
end: function()
{
	unbind_fbo();
	gl.disable(gl.DEPTH_TEST);
	this.prg_fs.bind();
	this.tex1.bind(0);
	update_uniform('a',this.a);
	update_uniform('b',this.b);
	update_uniform('c',this.c);
	gl.drawArrays(gl.TRIANGLES,0,3);
	unbind_texture2d();
	unbind_shader();
},
add_interface: function()
{
	if (this.fs) { return; }
	this.fs = UserInterface.use_field_set('V','post-process');
	let sl_a = UserInterface.add_slider('luminosity',-100,100,0, (v) => { this.a = 0.01*v; update_wgl();});
	let sl_b = UserInterface.add_slider('contrast',-200,200,0, (v) => { this.b = 1+0.01*v; update_wgl();});
	let sl_c = UserInterface.add_slider('power',-100,100,0, (v) => { this.c = 1+0.01*v; update_wgl();});
	UserInterface.use_group('H');
	UserInterface.add_button('reset', () =>
	{
		this.a = 0; sl_a.value = 0;
		this.b = 1; sl_b.value = 1;
		this.c = 1; sl_c.value = 1;
		update_wgl();
	});
	
	UserInterface.add_hspace(4);
	UserInterface.add_button('X', () => {
		UserInterface.interf.removeChild(this.fs);
		UserInterface.adjust_width();
		this.fs = null;
	}); 

	UserInterface.end_use();
	UserInterface.end_use();
	UserInterface.adjust_width();
}
};

function enable_post_process()
{
	ProcessImage.enable();
	ProcessImage.add_interface();
}


