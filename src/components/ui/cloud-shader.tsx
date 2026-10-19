"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type CloudShaderProps = {
  className?: string;
  children?: React.ReactNode;
  speed?: number;
  count?: number;
  cloudColor?: string;
  skyTopColor?: string;
  skyBottomColor?: string;
};

const vertexShader = `attribute vec2 position; varying vec2 uv; void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
const fragmentShader = `precision highp float; varying vec2 uv; uniform vec2 resolution; uniform float time; uniform float speed; uniform float count; uniform vec3 cloud; uniform vec3 top; uniform vec3 bottom;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+17.;a*=.5;}return v;}
void main(){float aspect=resolution.x/resolution.y;vec2 p=vec2(uv.x*aspect,uv.y);vec3 color=mix(bottom,top,uv.y);color+=vec3(.82,.78,1.)*exp(-length(p-vec2(aspect*.8,.9))*length(p-vec2(aspect*.8,.9))*5.)*.12;for(int i=0;i<6;i++){if(float(i)>=count)continue;float fi=float(i);float y=.18+fi*.13;float x=mod(fi*.53+time*speed*(.012+fi*.002),aspect+.9)-.45;vec2 q=p-vec2(x,y);float radius=.18+fi*.045;float envelope=1.-length(vec2(q.x/(radius*(1.2+fi*.08)),q.y/(radius*.58)));float detail=fbm(q*5.+fi*9.+time*speed*.015);float density=smoothstep(.05,.45,envelope+(detail-.5)*.55);vec3 lit=mix(cloud,vec3(1.0,.99,1.0),.38-.03*fi);vec3 lavender=vec3(.78,.76,.96);vec3 shadow=mix(lavender,cloud,.38);color=mix(color,mix(lit,shadow,smoothstep(.2,.8,1.-detail)),density*.92);}gl_FragColor=vec4(color,1.);}`;

function color(value: string) { const hex=value.replace("#",""); if(hex.length===6)return [parseInt(hex.slice(0,2),16)/255,parseInt(hex.slice(2,4),16)/255,parseInt(hex.slice(4),16)/255]; const m=value.match(/[\d.]+/g); return m?.length===3?m.map(Number).map(v=>v/255):[1,1,1]; }

export function CloudShader({ className, children, speed=1, count=6, cloudColor="#fffaf2", skyTopColor="#b9dcf5", skyBottomColor="#f4b8d5" }: CloudShaderProps) {
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{const canvas=ref.current;if(!canvas)return;const gl=canvas.getContext("webgl",{alpha:false,antialias:false});if(!gl)return;const compile=(type:number,source:string)=>{const shader=gl.createShader(type);if(!shader)return null;gl.shaderSource(shader,source);gl.compileShader(shader);return gl.getShaderParameter(shader,gl.COMPILE_STATUS)?shader:null};const v=compile(gl.VERTEX_SHADER,vertexShader),f=compile(gl.FRAGMENT_SHADER,fragmentShader);if(!v||!f)return;const program=gl.createProgram();if(!program)return;gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);const position=gl.getAttribLocation(program,"position");gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);const uniforms={resolution:gl.getUniformLocation(program,"resolution"),time:gl.getUniformLocation(program,"time"),speed:gl.getUniformLocation(program,"speed"),count:gl.getUniformLocation(program,"count"),cloud:gl.getUniformLocation(program,"cloud"),top:gl.getUniformLocation(program,"top"),bottom:gl.getUniformLocation(program,"bottom")};let frame=0;const resize=()=>{const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(1,canvas.clientWidth*dpr);canvas.height=Math.max(1,canvas.clientHeight*dpr);gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(uniforms.resolution,canvas.width,canvas.height)};const observer=new ResizeObserver(resize);observer.observe(canvas);resize();const started=performance.now();const draw=(now:number)=>{gl.uniform1f(uniforms.time,(now-started)/1000);gl.uniform1f(uniforms.speed,speed);gl.uniform1f(uniforms.count,Math.max(1,Math.min(6,count)));gl.uniform3fv(uniforms.cloud,color(cloudColor));gl.uniform3fv(uniforms.top,color(skyTopColor));gl.uniform3fv(uniforms.bottom,color(skyBottomColor));gl.drawArrays(gl.TRIANGLES,0,3);frame=requestAnimationFrame(draw)};frame=requestAnimationFrame(draw);return()=>{cancelAnimationFrame(frame);observer.disconnect();gl.deleteProgram(program);gl.deleteBuffer(buffer)}},[cloudColor,count,skyBottomColor,skyTopColor,speed]);
  return <div className={cn("relative h-full min-h-80 w-full overflow-hidden",className)}><canvas ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 size-full" />{children&&<div className="relative z-10 flex size-full items-center justify-center">{children}</div>}</div>;
}
