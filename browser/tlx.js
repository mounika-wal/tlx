(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function() {
	require("./src/tlx-vtdom.js");
	require("./src/tlx-sanitize.js");
	require("./src/tlx-directives.js");
	require("./src/tlx-component.js");
	require("./src/tlx-state.js");
	require("./src/tlx-template.js");
	require("./src/tlx-polyfill.js");
})();
},{"./src/tlx-component.js":2,"./src/tlx-directives.js":3,"./src/tlx-polyfill.js":4,"./src/tlx-sanitize.js":5,"./src/tlx-state.js":6,"./src/tlx-template.js":7,"./src/tlx-vtdom.js":8}],2:[function(require,module,exports){
(function() {
	"use strict";
	/* Copyright 2017, AnyWhichWay, Simon Y. Blackwell, MIT License
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
	*/
	const tlx = this.tlx || (this.tlx = {});
	tlx.options || (tlx.options={});
	tlx.options.components = true;
	tlx.components = {};
	tlx.define = function(tagName,component) {
		this.components[tagName] = component;
		if(this.promises && this.promises[tagName]) {
			this.promises[tagName](component);
		}
	}
	tlx.get = function(tagName) {
		return this.components[tagName];
	}
	tlx.mount = function(...tagNames) {
		tagNames.length>0 || (tagNames = Object.keys(this.components));
		for(let tagName of tagNames) {
			const component = this.components[tagName],
				elements = [].slice.call(document.getElementsByTagName(tagName)||[]);
			for(let element of elements) {
				if(!element.vnode) {
					const attributes = [].slice.call(element.attributes).reduce((accum,attribute) => { accum[attribute.name] = attribute.value; return accum; },{});
					component(attributes,element).vnode.render();
				}
			}
		}
	}
	tlx.whenDefined = function(tagName) {
		this.promises || (this.promises = {});
		let resolver;
		const promise = new Promise(resolve => resolver = resolve);
		this.promises[tagName] = resolver;
		!this.components[tagName] || resolver(this.components[tagName]);
		return promise;
	}
	tlx.getTagName = function(component) {
		for(let tagName in this.components) {
			if(this.components[tagName]===component || this.components[tagName].class===component) return tagName;
		}
	}
	tlx.Mixin = {
		initialize(attributes={}) {
			const properties = Object.assign({},attributes);
			for(let key in properties) {
				const value = properties[key],
					type = typeof(value);
				type!=="object" || delete attributes[key];
			}
			const vnode = this.vNode(null,attributes);
			for(let key in properties) {
				vnode[key] = tlx.resolve(vnode,properties[key],attributes,vnode.state);
			}
			return vnode;
		},
	/*	toString() { 
			const stringify = (v) => {
					const type = typeof(v);
					if(type==="string") return v;
					if(v && type==="object") {
						if(Array.isArray(v)) v = v.map(item => (item && typeof(item)==="object" && item instanceof HTMLElement ? item.getAttributes() : item));
						else if (v instanceof HTMLelement) v = v.getAttributes();
						return "${" + JSON.stringify(v) + "}";
					}
					return JSON.stringify(v);
				}
			return `<${this.localName}${[].slice.call(this.attributes).reduce((accum,attribute) => accum += (` ${attribute.name}="${stringify(this.getAttribute(attribute.name))}"`),"")}>${this.innerHTML}</${this.localName}>`
		}*/
	}
	
	if(typeof(module)!=="undefined") module.exports = tlx;
	if(typeof(window)!=="undefined") window.tlx = tlx;
}).call(typeof(window)!=="undefined" ? window : this);
},{}],3:[function(require,module,exports){
(function() {
	"use strict";
	/* Copyright 2017,2018 AnyWhichWay, Simon Y. Blackwell, MIT License
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
	*/
	const tlx = this.tlx || (this.tlx = {});
	tlx.options || (tlx.options={});
	tlx.directives || (tlx.directives={});
	Object.assign(this.tlx.directives,{
			"t-if": (value,template,vnode) => {
				if(value) {
					const el = document.createElement("div"),
						resolved = el.vNode(tlx.resolve(vnode,template,null,vnode.currentState,{value}));
					if(resolved.children) return resolved.children;
					return resolved;
				}
				return [];
			},
			"t-for": (spec,template,vnode) => {
					const el = document.createElement("div"),
						children = [];
	  			if(spec.of) {
	  				spec.of.forEach((value,index,array) => {
	  					const extra = {[spec.let||spec.var]:value,value,index,array},
	  						resolved = el.vNode(template.resolve ? template.resolve(null,vnode.currentState,extra): tlx.resolve(vnode,template,null,vnode.currentState,extra));
	  					children[index] = (resolved.children ? resolved.children[0] : resolved);
	  				});
	  			} else {
	  				Object.keys(spec.in).forEach((key,index) => {
	  					const extra = {[spec.let||spec.var]:key,value:spec.in[key],key,object:spec.in},
  							resolved = el.vNode(template.resolve ? template.resolve(null,vnode.currentState,extra): tlx.resolve(vnode,template,null,vnode.currentState,extra));
	  					children[index] = (resolved.children ? resolved.children[0] : resolved);
	  				});
	  			}
	  			return children;
			},
			"t-foreach": (value,template,vnode) => {
				if(Array.isArray(value)) return tlx.directives["t-for"]({of:value,let:'value'},template,vnode);
				return tlx.directives["t-for"]({in:value,let:'key'},template,vnode);
			},
			"t-on": (value,_,vnode) => {
				for(let key in value) {
					vnode.attributes["on"+key] = `(${value[key]})(event)`;
				}
			}
	});
	if(typeof(module)!=="undefined") {
		module.exports = tlx;
	}
	if(typeof(window)!=="undefined") {
		window.tlx = tlx;
	}
}).call(typeof(window)!=="undefined" ? window : this);
},{}],4:[function(require,module,exports){
(function() {
	"use strict"
	/* Copyright 2017, AnyWhichWay, Simon Y. Blackwell, MIT License
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
	*/
	const global = this,
		tlx = this.tlx || (this.tlx = {});
	tlx.options || (tlx.options={});
	const polyfill = (typeof(global.customElements)==="undefined" ? "force" : true);
	tlx.options.polyfill = polyfill;
	polyfill!=="force" || (tlx.options.components = true);
	tlx.polyfill = function(force) {
		if(polyfill==="force" || force) {
			const _document_createElement = document.createElement.bind(document);
			document.createElement = function(tagName,options) {
				const ctor = tlx.customElementRegistry.get(tagName);
				const el = _document_createElement(tagName,options);
				if(ctor) {
					ctor(el);
					!el.adoptedCallback || setTimeout(() => el.adoptedCallback(null,document));
				}
				return el;
			}
			const document_adoptNode = document.adoptNode.bind(document);
			document.adoptNode = function(node) {
				const olddocument = node.ownerDocument;
				node = _document_adoptNode(node);
				!node.adoptedCallback || document===olddocument || setTimeout(() => node.adoptedCallback(olddocument,document));
				return node
			}
			const node_appendChild = Node.prototype.appendChild;
			Node.prototype.appendChild = function(node) {
				!node.connectedCallback || node.ownerDocument || setTimeout(() => node.connectedCallback());
				return node_appendChild.call(this,node);
			}
			const node_insertBefore = Node.prototype.insertBefore;
			Node.prototype.insertBefore = function(newChild,referenceChild) {
				!newChild.connectedCallback || newChild.ownerDocument || setTimeout(() => newChild.connectedCallback());
				return node_insertBefore.call(this,newChild,referenceChild);
			}
			const node_removeChild = Node.prototype.removeChild;
			Node.prototype.removeChild = function(node) {
				!node.disconnectedCallback || setTimeout(() => node.disconnectedCallback());
				return node_removeChild.call(this,node);
			}
			const node_replaceChild = Node.prototype.replaceChild;
			Node.prototype.replaceChild = function(newChild,oldChild) {
				!newChild.connectedCallback || newChild.ownerDocument || setTimeout(() => newChild.connectedCallback());
				!oldChild.disconnectedCallback || setTimeout(() => oldChild.disconnectedCallback());
				return node_replaceChild.call(this,newChild,oldChild);
			}
			
			const _HTMLElement = HTMLElement;
			global.HTMLElement = class HTMLElement { 
				constructor(tagName) {
					const el =  _document_createElement(tagName);
					Object.defineProperty(this,"__el__",{enumerable:false,configurable:true,writable:true,value:el});
					const prototype = Object.getPrototypeOf(this),
						descriptors = Object.getOwnPropertyDescriptors(prototype);
					for(let key in descriptors) {
						key==="constructor" || (el[key] = prototype[key]);
					}
					el.vNode();
				}
			}
			tlx.customElementRegistry = {
					define(name,cls,options) {
							const ctor = function(attributes={},el=_document_createElement(name)) {
								Object.defineProperty(el,"constructor",{enumerable:false,configurable:true,writeable:true,value:cls});
								const instance = new cls(name),
									proto = Object.create(cls.prototype);
								Object.keys(instance).forEach(key => (el[key] = instance[key])); // should this be getOwnPropertyDescriptors?
								Object.defineProperty(el,"vnode",{enumerable:false,configurable:true,writable:true,value:instance.vnode});
								!instance.__setAttribute__ || Object.defineProperty(el,"__setAttribute__",{enumerable:false,configurable:true,writable:true,value:instance.__setAttribute__});
								for(let key in attributes) {
									el.setAttribute(key,attributes[key],true);
									if(cls.observedAttributes && cls.observedAttributes.includes(key) && el.attributeChangedCallback) {
										el.attributeChangedCallback(key,null,attributes[key],null);
									}
								}
								return el;
							}
							ctor.class = cls;
							tlx.define(name,ctor);
					},
					get(name) {
						return tlx.get(name);
					},
					whenDefined(name) {
						return tlx.whenDefined(name);
					}
			}
			Object.defineProperty(global,"customElements",{enumerable:true,configurable:true,writable:false,value:tlx.customElementRegistry});
		}
	}
	tlx.polyfill();
	
	if(typeof(module)!=="undefined") module.exports = tlx;
	if(typeof(window)!=="undefined") window.tlx = tlx;
}).call(typeof(window)!=="undefined" ? window : this);
},{}],5:[function(require,module,exports){
(function() {
	"use strict";
	/* Copyright 2017,2018, AnyWhichWay, Simon Y. Blackwell, MIT License
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
	*/

	const tlx = this.tlx || (this.tlx = {});
	tlx.options || (tlx.options={});
	tlx.options.sanitize = true;
	
		const cleaner = tlx.escape = (data,extensions={},options=cleaner.options) => {
			// include extensions, to exclude standard options pass {coerce:[],accept:[],reject:[],escape:[],eval:false} as third argument
			options = Object.keys(options).reduce((accum,key) => 
					{ 
						if(Array.isArray(options[key])) { // use union of arrays
							accum[key] = (extensions[key]||[]).reduce((accum,item) => { accum.includes(item) || accum.push(item); return accum; },options[key].slice());
						} else if(typeof(extensions[key])==="undefined") {
							accum[key] = options[key];
						} else {
							accum[key] = extensions[key];
						} 
						return accum;
					},
				{});
			// data may be safe if coerced into a proper format
			data = options.coerce.reduce((accum,coercer) => coercer(accum),data);
			//these are always safe
			if(options.accept.some(test => test(data))) return data;
		    //these are always unsafe
			if(options.reject.some(test => test(data))) return;
		    //remove unsafe data from arrays
			if(Array.isArray(data)) {
				data.forEach((item,i) => data[i] = cleaner(data)); 
				return data;
			}
	    //recursively clean data on objects
			if(data && typeof(data)==="object") { 
				for(let key in data) {
					const cleaned = cleaner(data[key]);
					if(typeof(cleaned)==="undefined") {
						delete data[key];
					} else {
						data[key] = cleaned;
					}
				}
				return data;
			}
			if(typeof(data)==="string") {
				data = options.escape.reduce((accum,escaper) => escaper(accum),data); // escape the data
				if(options.eval) {
					try {
						// if data can be converted into something that is legal JavaScript, clean it
						// make sure that options.reject has already removed undesireable self evaluating or blocking functions
						// call with null to block global access
						return cleaner(Function("return " + data).call(null));
					} catch(error) {
						// otherwise, just return it
						return data;
					}
				}
			}
		return data;
	}
	// statically merge extensions into default options
	cleaner.extend = (extensions) => {
		const options = cleaner.options;
		cleaner.options = Object.keys(options).reduce((accum,key) => 
			{ 
				if(Array.isArray(options[key])) { // use union of arrays
					accum[key] = (extensions[key]||[]).reduce((accum,item) => { accum.includes(item) || accum.push(item); return accum; },options[key].slice());
				} else if(typeof(extensions[key])==="undefined") {
					accum[key] = options[key];
				} else {
					accum[key] = extensions[key];
				} 
				return accum;
			},
		{});
	}
	// default options/support for coerce, accept, reject, escape, eval
	cleaner.options = {
		coerce: [],
		accept: [data => !data || ["number","boolean"].includes(typeof(data))],
		reject: [
			// executable data
			data => typeof(data)==="function",
			// possible server execution like <?php
			data => typeof(data)==="string" && data.match(/<\s*\?\s*.*\s*/),
			// direct eval, might block or negatively impact cleaner itself,
			data => typeof(data)==="string" && data.match(/eval|alert|prompt|dialog|void|cleaner\s*\(/),
			// very suspicious,
			data => typeof(data)==="string" && data.match(/url\s*\(/),
			// might inject nastiness into logs,
			data => typeof(data)==="string" && data.match(/console\.\s*.*\s*\(/),
			// contains javascript,
			data => typeof(data)==="string" && data.match(/javascript:/),
			// arrow function
			data => typeof(data)==="string" && data.match(/\(\s*.*\s*\)\s*.*\s*=>/),
			// self eval, might negatively impact cleaner itself
			data => typeof(data)==="string" && data.match(/[Ff]unction\s*.*\s*\(\s*.*\s*\)\s*.*\s*\{\s*.*\s*\}\s*.*\s*\)\s*.*\s*\(\s*.*\s*\)/),	
		],
		escape: [ 
			data => { // handle possible query strings
				if(typeof(data)==="string" && data[0]==="?") { 
					const parts = data.split("&");
					let max = parts.length;
					return parts.reduce((accum,part,i) => { 
							const [key,value] = decodeURIComponent(part).split("="),
								type = typeof(value), // if type undefined, then may not even be URL query string, so clean "key"
								cleaned = (type!=="undefined" ? cleaner(value) : cleaner(key)); 
							if(typeof(cleaned)!=="undefined") {
								// keep only those parts of query string that are clean
								accum += (type!=="undefined" ? `${key}=${cleaned}` : cleaned) + (i<max-1 ? "&" : "");
							} else {
								max--;
							}
							return accum;
						},"?");
				}
				return data;
			},
			data => { // handle escaping html entities
				if(typeof(data)==="string" && data[0]!=="?" && typeof(document)!=="undefined") {
						// on client or a server DOM is operable
			  	 const div = document.createElement('div');
			  	 div.appendChild(document.createTextNode(data));
			  	 return div.innerHTML;
			  	}
				return data;
			}
		],
		eval: true
	}
	function setAttribute(name,value) {
		 const cleaned = (name.indexOf("on")===0 ? value : cleaner(value));
	   if(typeof(cleaned)!=="undefined") {
	     this.__setAttribute__(name,cleaned);
	   }
	}
	cleaner.protect = (el) => {
		if(typeof(el.value)!=="undefined") {
			 const get = () => get._value,
		     set = (value) => {
		       const cleaned = cleaner(value);
		       if(typeof(cleaned)!=="undefined") {
		         get._value = cleaned;
		       }
		     };
		 // save current value;
		 get.__value = cleaner(el.value);
	   // re-define the value property so data is cleaned
	   Object.defineProperty(el,"value",{enumerable:true,
	                                     configurable:true,
	                                     get,set});
		}
	//redefine setAttribute so it works with cleaned value
		if(el.setAttribute!==setAttribute) {
			Object.defineProperty(el,"__setAttribute__",{enumerbale:false,configurable:true,writable:true,value:el.setAttribute});
		  el.setAttribute = setAttribute;
		}
	  for(let child of [].slice.call(el.children)) {
	  	cleaner.protect(child);
	  }
	  return el;
	}

	if(typeof(document)!=="undefined") {
	//on client or a server DOM is operable
	  const _documentCreateElement =
	        document.createElement.bind(document);
	  document.createElement = function(tagName,options) {
	    return cleaner.protect(_documentCreateElement(tagName,options));
	  }
	}

	if(typeof(window)!=="undefined") {
	// on client or a server pseudo window is available
		if(window.prompt) {
			const _prompt = window.prompt.bind(window);
			window.prompt = function(title) {
				const input = _prompt(title),
					cleaned = cleaner(input);
				if(typeof(cleaned)=="undefined") {
					window.alert("Invalid input: " + input);
				} else {
					return cleaned;
				} 
			}
		}
		window.addEventListener("load",() => {
			cleaner.protect(document.head);
			cleaner.protect(document.body);
		});
	}

	if(typeof(module)!=="undefined") module.exports = cleaner;
	if(typeof(window)!=="undefined") window.cleaner = cleaner;
}).call(this);
},{}],6:[function(require,module,exports){
(function() {
	"use strict";
	/* Copyright 2017,2018 AnyWhichWay, Simon Y. Blackwell, MIT License
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
	*/
	const tlx = this.tlx || (this.tlx = {});
	tlx.options || (tlx.options={});
	tlx.directives || (tlx.directives={});
	tlx.options.reactive = true;
	tlx.bind = (object,element,controller) => {
		return tlx.state(element.vNode(),object);
	}
	
	function createProxy(vnode,object,path="") {
		if(object.__isState__) return object;
		for(let key in object) {
			const value = object[key],
				type = typeof(value);
			if(value && type==="object") {
				object[key] = createProxy(vnode,value,(path.length>0 ? `${path}.${key}` : key));
			}
		}
		return new Proxy(object,{
			get(target,property) {
				if(property==="__isState__") return true;
				if(property==="__parentState__") {
					let parent = vnode.node.parentElement;
					while(parent) {
						const state = (parent.vnode ? parent.vnode.state : null);
						if(state) return state;
						parent = parent.parentElement;
					}
				}
				let value = target[property],
					type = typeof(value);
				if(type==="undefined") {
					let parent = vnode.node.parentElement,
						state;
					while(parent) {
						state = (parent.vnode ? parent.vnode.state : null);
						if(state) {
							value = state[property];
							if(typeof(value)!=="undefined") {
								return value;
							}
						}
						parent = parent.parentElement;
					}
				} else {
					const fullpath = (path.length>0 ? `${path}.${property}` : property),
						properties = this.get.properties || (this.get.properties = {}),
						nodes = properties[fullpath] || (properties[fullpath] = new Set());
					!tlx.CNODE || nodes.add(tlx.CNODE);
				}
				return value;
			},
			set(target,property,value) {
				const oldvalue = target[property];
				if(oldvalue!==value) {
					target[property] = value;
					const fullpath = (path.length>0 ? `${path}.${property}` : property),
						properties = this.get.properties;
					if(properties && properties[fullpath]) {
						for(let node of properties[fullpath]) node.render();
					}
				}
				return true;
			}
		});
	}
	tlx.state = (vnode,object={}) => vnode.state = createProxy(vnode,object);
	tlx.directives["t-state"] = (value,_,vnode) => {
		tlx.state(vnode,value);
	}
	HTMLElement.prototype.linkState = function(property) {
		const f = function(event) {
			const target = event.target;
			if([HTMLInputElement,HTMLTextAreaElement,HTMLSelectElement,HTMLAnchorElement].some(cls => target instanceof cls)) {
				let value;
				if(target.type==="checkbox") {
					value = target.checked;
				}
				else if(target.type==="select-multiple") {
					value = [];
					for(let option of [].slice.call(target.options)) {
						!option.selected || value.push((tlx.options.sanitize ? tlx.escape(option.value) : option.value));
					}
				} else {
					value = (tlx.options.sanitize ? tlx.escape(target.value) : target.value);
				}
				const parts = property.split(".");
				let state = this;
				property = parts.pop(); // get final property
				for(let key of parts) {
					state = state[key] || {};
				} // walk tree
				state[property] = value; // set property
			}
		};
		let state = this.__vNode__.attributes.state;
		if(!state) {
			const as = this.__vNode__.getAncestorWithState();
			state = as.state;
		}
		if(!state) {
			console.warn("Attempting to use linkState when no state exists in DOM tree.")
		}
		return f.bind(state);
	}
	
}).call(this);
},{}],7:[function(require,module,exports){
(function() {
	"use strict";
	/* Copyright 2017, AnyWhichWay, Simon Y. Blackwell, MIT License
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
	*/
	const tlx = this.tlx || (this.tlx = {});
	tlx.options || (tlx.options={});
	tlx.options.templates = true;
	if(!tlx.options.components) console.warn("tlx-component.js mut be loaded to use tlx-template");
	//tlx.polyfill(true);
	tlx.compile = function(template) {
		const tagname = template.getAttribute("t-tagname");
		if(!tagname) return;
		const clone = document.createElement(tagname);
		clone.innerHTML = template.innerHTML;
		const	styles = clone.querySelectorAll("style")||[],
			scripts = clone.querySelectorAll("script")||[];
		for(let style of [].slice.call(styles)) {
			let spec = style.innerText,
				matches = spec.match(/.*\{.+\}/g),
				text = (matches ? matches.reduce((accum,item) => accum += `${tagname} ${item.trim()} `,"") : "");
			spec = (matches ? matches.reduce((accum,item) => accum = accum.replace(item,""),spec) : spec);
			matches = spec.match(/.*;/g),
			text = (matches ? matches.reduce((accum,item) => accum += `${tagname} * {${item.trim()}} `,text) : text);
			style.innerText = text.trim();
			document.head.appendChild(style);
		}
		const scope = [].slice.call(template.attributes).reduce((accum,attribute) => { ["id","t-tagname"].includes(attribute.name) || (accum[attribute.name] = attribute.value); return accum; },{});
		for(let script of [].slice.call(scripts)) {
			const newscope = Function(`with(this) { ${script.innerText}; }`).call(scope);
			!newscope || (scope = newscope);
			clone.removeChild(script);
		}
		const templatehtml = clone.innerHTML.replace(/&gt;/g,">").replace(/&lt;/g,"<");
		scope.render = function() { 
			return this.html(templatehtml,Object.assign({},scope,this.attributes));
		}
		const component = Function("defaults",`return function(attributes={},el=document.createElement("${tagname}")) {
					Object.assign(el,tlx.Mixin);
					el.initialize(Object.assign({},defaults,attributes));
					return el;
					}`)(scope);
		this.define(tagname,component);
	}
}).call(this);
},{}],8:[function(require,module,exports){
(function() {
	"use strict";
	/* Copyright 2017,2018 AnyWhichWay, Simon Y. Blackwell, MIT License
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
	*/
	const global = this,
		tlx = this.tlx || (this.tlx = {});
	tlx.options || (tlx.options={});
	tlx.render = (vnode,el) => {
		if(vnode instanceof VNode) {
			vnode.render();
			el.appendChild(vnode.node);
		}
	}
	tlx.escape || (tlx.escape = value => value);
	tlx.resolve = (vnode,tmplt,attr={},state=(vnode ? vnode.state : {}),extra={}) => {
		if(typeof(tmplt)==="string") {
			const first = tmplt.indexOf("${");
			if(first>=0) {
				let result;
				tlx.CNODE = vnode;
				let parent = (vnode ? vnode.node.parentNode : null);
				while(!state && parent) {
					state = (parent.vnode ? parent.vnode.state : null);
					parent = parent.parentNode;
				}
				state || (state = {});
				if(tmplt.indexOf("${",first+1)>=0 || first>0) {
					result = Function("__a__","vnode","__s__","__e__",
						"while(__s__) { try { with(__a__) { with(vnode) { with(__s__) { with(__e__) { return `" + tmplt.trim() + "`}}}}} catch(error) { __s__ = __s__.__parentState__; }}")(attr||{},vnode,state||{},extra); }
				else { 
					result =  Function("__a__","vnode","__s__","__e__",
						"while(__s__) { try { with(__a__) { with(vnode) { with(__s__) { with(__e__) { return (function() { return arguments[arguments.length-1]; })`" + tmplt.trim() + "` }}}}} catch(error) { __s__ = __s__.__parentState__; }}")(attr||{},vnode,state||{},extra);
				}
				tlx.CNODE = null;
				return result;
			}
		}
		return tmplt;
	}
	
	class VNode {
		constructor(nodeName,attr,children,node) {
			Object.defineProperty(node,"vnode",{enumerable:false,configurable:true,writable:true,value:this});
			this.node = node;
			this.nodeName = nodeName,
			this.attributes = attr = Object.assign({},attr);
			this.children = children.slice();
			this.key = attr.id || (attr.id = `id${(Math.random()+"").substring(2)}`);
			global[attr.id] = this;
		}
		h() {
			const vdom = {nodeName:this.nodeName,attributes:{},children:[],key:this.key};
			for(let key in this.attributes) {
				let value = tlx.resolve(this,this.attributes[key],null,this.currentState),
					i;
				if(typeof(value)==="string" && (i=value.lastIndexOf(")"))===value.trim().length-1 && i>value.indexOf(")")) {
					const body = value.substring(0,value.lastIndexOf("("));
					value = new Function("return " + body)();
				}
				if(key.indexOf("on")!==0) value = tlx.escape(value);
				if(typeof(value)!=="undefined") vdom.attributes[key] = value;
			}
			for(let child of this.children) vdom.children.push(child.h ? child.h() : tlx.resolve(this,child,this.attributes,this.currentState));
			return vdom;
		}
		html(tmplt,attr) {
			const id = this.attributes.id,
				html = tlx.resolve(this,tmplt,this.attributes,this.state,attr),
				el = document.createElement("div"),
				vnode = el.vNode(html);
			this.attributes = Object.assign({},this.attributes,vnode.attributes);
			!id || (this.attributes.id = id);
			this.children = vnode.children;
			VNode.prototype.render.call(this);
			return this;
		}
		toString() {
			return this.resolve();
		}
		resolve(attr,state,extra={}) {
			attr || (attr = this.attributes);
			return `<${this.nodeName}${Object.keys(attr).reduce((accum,key) => accum += (` ${key}="${attr[key]}"`),"")}>${this.children.reduce((accum,child) => accum += " " + (child.resolve ? child.resolve(null,state||this.state,extra) : tlx.resolve(this,child,null,state||this.state,extra)),"")}</${this.nodeName}>`;
		}
		render(attr,state) {
			const node = this.node;
			attr = Object.assign({},this.attributes,attr);
			if(this.state) Object.assign(this.state,state)
			this.currentState = this.state || state;
			let vchildren;
			for(let key in attr) {
				let value = tlx.resolve(this,attr[key],null,state);
				if(tlx.directives && tlx.directives[key]) vchildren = tlx.directives[key](value,this.children[0],this);
				value = (value && typeof(value)==="object" ? "${" + JSON.stringify(value) + "}" : value);
				node.attributes[key]===value || node.setAttribute(key,value);
			}
			// adjust state in case state added
			this.currentState = this.state || state;
			const nchildren = [].slice.call(node.childNodes);
			vchildren || (vchildren = this.children);
			for(let i=0;i<nchildren.length;i++) {
				const nchild = nchildren[i];
				if(i>=vchildren.length) node.removeChild(nchild);
				else {
					const vchild = vchildren[i];
					if(nchild instanceof Text) {
						const text = tlx.resolve(this,vchild,this.attributes,this.currentState);
						nchild.textContent===text || (nchild.textContent=text);
					} else if(vchild.node!==nchild) {
						vchild.render();
						node.replaceChild(vchild.node,nchild);
					} else vchild.render();
				}
			}
			for(let i=nchildren.length;i<vchildren.length;i++) {
				const vchild = vchildren[i];
				if(typeof(vchild)==="string") {
					const text = tlx.resolve(this,vchild,this.attributes,this.currentState);
					node.appendChild(new Text(text))
				} else node.appendChild(vchildren[i].render().node);
			}
			return this;
		}
	}
	
	HTMLElement.prototype.render = function(attr,html) {
		(!html && this.vnode) || (this.vnode = this.vNode(html,attr));
		return (html ? this.vnode.render() : this.vnode.render(attr));
	}

	Text.prototype.vNode = HTMLElement.prototype.vNode = function(html,attr) {
		if([HTMLScriptElement,HTMLTemplateElement].some(ctor => this instanceof ctor)) return;
		if(html!=null) {
			this.innerHTML = html;
			delete this.vnode;
		}
		let vnode = this.vnode;
		if(!vnode) {
			if(this.tagName) {
				const ownattr = [].slice.call(this.attributes).reduce((accum,attribute) => { accum[attribute.name] = attribute.value; return accum; },{})
				vnode = new VNode(this.tagName,Object.assign({},ownattr,attr),[],this);
			} else if(this instanceof Text) {
				const text = this.data.trim();
				if(text.length>0) vnode = text;
			}
		}
		if(!vnode) {
			!this.parentElement || this.parentElement.removeChild(this);
		} else if(this.tagName) {
			const children = vnode.children = [];
			for(let child of [].slice.call(this.childNodes)) {
				if(child.vNode) {
					const v = child.vNode();
					!v || children.push(v);
				}
			}
		}
		return vnode;
	}

	if(typeof(window)!=="undefined") {
		window.addEventListener("load",() => {
			if(tlx.compile) {
				const templates = document.getElementsByTagName("template")||[];
				for(let template of templates) tlx.compile(template);
			}
			!tlx.mount || tlx.mount();
			document.body.render();
		});
	}
		
	if(typeof(module)!=="undefined") {
		module.exports = tlx;
	}
	if(typeof(window)!=="undefined") {
		window.tlx = tlx;
	}
}).call(typeof(window)!=="undefined" ? window : this);
},{}]},{},[1]);
