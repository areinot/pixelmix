fancyMod=function(a,b) { return (a%b+b)%b; } //modulo that handles negative numbers properly, e.g. -1 % 4 = 3
fancyDefined=function(v) { return v !== undefined && v !== null; }

class PixelMix { //@@@ extends HTMLElement {
	constructor(element) {
		//@@@ super(); 
		
		//VARS
		this.element = null;		//parent DOM element, editable by CSS and user
		this.frame = null;			//^ canvas frame DOM element, used to measure exact contents of parent
		this.canvas = null;			//  ^ canvas DOM element
		this.context = null;		//    ^ canvas context
		
		this.images = [];		//array of Image objects (not in DOM)
		this.imageA = null;		//lesser image object
		this.imageB = null;		//next image object
		this.blendT = 0.0;		//interpolant between image A and image B

		this.slider = null;		//external slider DOM element, if specified
		this.sliderT = 0.5;		//interpolant between the first image and the last
		
		//DOM	
		if(!fancyDefined(element)) {
			console.error("Pixel-Mix Error: No DOM element found.");
			return;
		}
		this.element = element;

		//IMAGES		
		var imagesAttrib = this.element.getAttribute("images");
		if(!fancyDefined(imagesAttrib)) {
			console.error("Pixel-Mix Error: HTML tag has invalid/missing 'images' property.");
			return;
		}
		var imageList = JSON.parse(imagesAttrib);
		for(var i=0; i<imageList.length; ++i) {
			var img = new Image();
			img.src = imageList[i]; //triggers load
			this.images.push(img);			
		}
		
		//CANVAS
		this.frame = document.createElement('div');		
		this.frame.style.left =
		this.frame.style.right =
		this.frame.style.top =
		this.frame.style.bottom = 0;
		this.element.insertBefore(this.frame, this.element.firstChild);

		this.canvas = document.createElement('canvas');
		this.context = this.canvas.getContext('2d');
		this.frame.appendChild(this.canvas);
				
		//SLIDER
		this.slider = document.createElement("input");
		this.frame.appendChild(this.slider);
		this.slider.type = "range";
		this.slider.style.position = "relative";
		this.slider.style.bottom = 40;
		this.slider.style.marginLeft =
		this.slider.style.marginRight = "auto";
		this.slider.style.width = "50%";		
		this.slider.style.height = 30;
		this.slider.style.display = "block";
		//this.slider.className = "pixel-mix-slider";	
		
		this.slider.style["focus"] = "none";
		this.slider.style["-webkit-appearance"] = "none";
		this.slider.style.background = "green";

		this.slider.style["[type=range]::-moz-range-thumb"].background = "yellow";
		//this.slider.style["-webkit-slider-thumb"]["-webkit-appearance"] = "none";
		/*

input[type=range]::-moz-range-thumb {
    border: none;
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: goldenrod;
}

////

input[type=range] {
  -webkit-appearance: none; // Hides the slider so that custom slider can be made
  width: 100%; // Specific width is required for Firefox.
  background: transparent; // therwise white in Chrome
}

input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
}

input[type=range]:focus {
  outline: none; // Removes the blue border. You should probably do some kind of focus styling for accessibility reasons though.
}

input[type=range]::-ms-track {
  width: 100%;
  cursor: pointer;

//Hides the slider so custom styles can be added
  background: transparent; 
  border-color: transparent;
  color: transparent;
}
		*/
		

		//SLIDER FUNCTION
		this.slider.min = 0;
		this.slider.max = 100;
		this.slider.value = this.slider.max * this.sliderT;
		this.slider.addEventListener("input", function(ev) {
			this.setMix(this.slider.value * 0.01);
		}.bind(this));

		//FINALIZE
		//pick images and make sure they draw once the resources are loaded
		this.setMix(this.sliderT);

		//EVENTS		
		window.addEventListener("load", 		function(ev) { this._resize(); }.bind(this));
		window.addEventListener("resize",		function(ev) { this._resize(); }.bind(this)); //TODO: throttle this?
		this.imageA.addEventListener("load", 	function(ev) { this._resize(); }.bind(this)); //draw when the first two images finish loading
		this.imageB.addEventListener("load", 	function(ev) { this._resize(); }.bind(this));
	}

	setMix(t) {
		t = Math.max(0.0, Math.min(t, 1.0));
		var span = this.images.length-1;
		var A = Math.floor(t * span);
		var B = Math.min(A + 1, span + 1);
		this.blendT = (t * span) - A;

		//very last step needs to end at A:0, B:1			
		if(B == span + 1) {
			this.blendT = 1.0; 
			B = span;
		}
		this.imageA = this.images[A];
		this.imageB = this.images[B];		
		this.sliderT = t;
		this._draw();
	}

	static initDOM() {		
		//NOTE: This is run after the whole page is done loading because getBoundingClientRect() doesn't work before that
	  	var data = {};
	  	data.dothething=function() {
			data.mixers = [];
			Array.prototype.filter.call( document.getElementsByTagName("pixel-mix"), function(el) 	{ this.push(new PixelMix(el)); }.bind(this.mixers));
			Array.prototype.filter.call( document.getElementsByClassName("pixel-mix"), function(el) { this.push(new PixelMix(el)); }.bind(this.mixers));
		}.bind(data);
		window.addEventListener("DOMContentLoaded", data.dothething);		
		//data.dothething();
		return data.mixers;
	}

	_resize() {
		//NOTE: resize and getBoundingClientRect() does not work until the window.load() event is fired. DOMContentLoaded doesn't cut it.
		var w = this.images[0].naturalWidth;
		var h = this.images[0].naturalHeight;
		var aspect = h / Math.max(1.0, w);			
		
		var rect = this.frame.getBoundingClientRect();
		this.canvas.width = Math.abs(rect.right - rect.left);
		this.canvas.height = this.canvas.width * aspect;
		this._draw();
	}

	_draw() {
		var context = this.context;
		context.globalCompositeOperation = "source-over";
		if(this.imageA) context.drawImage(this.imageA, 0, 0, this.canvas.width, this.canvas.height);
		context.globalAlpha = this.blendT;
		if(this.imageB) context.drawImage(this.imageB, 0, 0, this.canvas.width, this.canvas.height);
		context.globalAlpha = 1.0;
	}
}

