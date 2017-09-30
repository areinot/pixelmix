
class PixelMix { //@@@ extends HTMLElement {
	constructor(element) {
		//@@@ super(); 
		
		//VARS

		//Note: init is optionally separate from the constructor to better time when DOM creation and loading callbacks happen.
		//For example an oncomplete callback may want to reference "this" but constructors are run in a limbo state where "this"
		//is not yet defined.
		this.element = null;
		this.slider = null;
		this.images = [];
		this.imageA = 0;		//lesser image index
		this.imageB = 0;		//next image index
		this.imageT = 0.0;		//interpolant between the first image and the last
		this.blendT = 0.0;		//interpolant between image A and image B

		//DOM

		if(element) {
			this.element = element;
			this.element.style = element.style || {};
			this.element.style.overflow = "hidden";

			for(var i=0; i<this.element.children.length; ++i) {
				var child = this.element.children[i];
				if(child.tagName.toLowerCase() == "img") this.images.push(child);
			}			
		} else {
			console.error("Pixel-Mix Error: No parent DOM element found.");
			return;
		}

		if(this.images.length > 0) {			
			for(var i=0; i<this.images.length; i++) {
				var img = this.images[i];
				img.style = img.style || {};
				this._noselect(img.style);
				img.style.opacity = 1.0;
				img.style.visibility = "hidden";
				if(i == 0) {
					img.style.position = "relative";					
				} else {
					img.style.position = "absolute";
				}
			}			
		}
		else
		{
			console.error("Pixel-Mix Error: Parent DOM element needs at least one image element.");
			return;
		}	
		
		//EVENTS

		this.element.addEventListener("click", function(ev) {			
			var t = this.imageT + 0.05;
			if(t > 1.0) t -= 1.0;
			this.pickImageByFraction(t);
		}.bind(this));		

		//TODO: throttle this
		window.addEventListener("resize", function(ev) {
			if(this.images && this.images.length) {
				this._fixImageSize(this.images[this.imageA]);
				this._fixImageSize(this.images[this.imageB]);
			}
		}.bind(this));

		//SLIDER

		if( this.element.id !== undefined && this.element.id !== null) {
			this.slider = document.getElementById(this.element.id + "-slider");
			this.slider.min = 0;
			this.slider.max = 100;
			this.slider.value = 50;		
			this.slider.addEventListener("input", function(ev) {				
				this.pickImageByFraction(this.slider.value * 0.01);
			}.bind(this));
		}		
		this.pickImageByFraction(0.5);
	}

	pickImageByFraction(t) {
		this.images[this.imageA].style.visibility =
		this.images[this.imageB].style.visibility = "hidden";

		t = Math.max(0.0, Math.min(t, 1.0));
		var span = this.images.length-1;
		this.imageA = Math.floor(t * span);
		this.imageB = Math.min(this.imageA + 1, span + 1);
		this.blendT = (t * span) - this.imageA;

		if(this.imageB == span + 1) {
			this.blendT = 1.0; //very last step needs to end at A:0, B:1
			this.imageB = span;
		}
		
		var styleA = this.images[this.imageA].style;
		var styleB = this.images[this.imageB].style;

		styleA.visibility =
		styleB.visibility = "visible";
		
		styleA.opacity = 1.0;
		styleB.opacity = this.blendT;

		this._fixImageSize(this.images[this.imageA]);
		this._fixImageSize(this.images[this.imageB]);
		
		this.imageT = t;
	}

	static initDOM() {
		//NOTE: This is run after the whole page is done loading because getBoundingClientRect() doesn't work before that
		//TODO: There might be a better solution for this. Like for instance canvas rendering.
	  	var data = {};
	  	data.dothething=function() {
			data.mixers = [];
			Array.prototype.filter.call( document.getElementsByTagName("pixel-mix"), function(el) {
				this.push(new PixelMix(el));
			}.bind(this.mixers));
			Array.prototype.filter.call( document.getElementsByClassName("pixel-mix"), function(el) {
				this.push(new PixelMix(el));
			}.bind(this.mixers));
			window.removeEventListener("load", this.dothething);
		}.bind(data);
		window.addEventListener("load", data.dothething);
		return data.mixers;
	}

	//helper nonsense

	_noselect(style) {
		style["-webkit-user-select"] = "none";  // Chrome, Safari
		style["-moz-user-select"] = "none";		//Firefox
		style["-ms-user-select"] = "none"; 		// IE 10+
		style["user-select"] = "none";
	}

	_fixImageSize(img) {
		if(img !== this.images[0]) {			
			var rect = this.images[0].getBoundingClientRect();
			if( rect.top == rect.bottom || rect.left == rect.right ) return;

			img.style.left = rect.left;
			img.style.top =  rect.top;
			img.style.width =  Math.abs(rect.right - rect.left);
			img.style.height = Math.abs(rect.top - rect.bottom);
		}
	}
}

