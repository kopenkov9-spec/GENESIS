(() => {
  // The optional motes pass submits a single instanced draw. Game geometry stays readable on Canvas 2D.
  const shader = `
 struct Params { time:f32, aspect:f32, seed:f32, energy:f32 }
 @group(0) @binding(0) var<uniform> u:Params;
 struct V { @builtin(position) p:vec4<f32>, @location(0) uv:vec2<f32>, @location(1) a:f32 }
 fn fractHash(n:f32)->f32 { return fract(sin(n*12.9898+u.seed)*43758.54); }
 @vertex fn vert(@builtin(vertex_index) vi:u32,@builtin(instance_index) inst:u32)->V{
  let q=array<vec2<f32>,6>(vec2(-1.,-1.),vec2(1.,-1.),vec2(-1.,1.),vec2(-1.,1.),vec2(1.,-1.),vec2(1.,1.));
  let id=f32(inst)+1.;let corner=q[vi];let xx=fract(fractHash(id)+u.time*.0018*fractHash(id+23.));let yy=fract(fractHash(id+8.)+u.time*.0011);
  let radius=.0018+.0034*fractHash(id+41.);var v:V;v.uv=corner;v.a=.13+u.energy*.11;v.p=vec4(vec2(xx,yy)*2.-1.+corner*radius/vec2(u.aspect,1.),0.,1.);return v;
 }
 @fragment fn frag(v:V)->@location(0) vec4<f32>{let a=max(0.,1.-length(v.uv))*v.a;return vec4(vec3(.66,.88,.75)*a,a);}
 `;
  class Motes {
    constructor(el) {
      this.el = el;
      this.active = false;
      this.tried = false;
    }
    async init() {
      if (this.tried || !navigator.gpu) return;
      this.tried = true;
      try {
        const adapter = await navigator.gpu.requestAdapter({
          powerPreference: 'low-power'
        });
        if (!adapter) return;
        const device = await adapter.requestDevice();
        this.device = device;
        const ctx = this.el.getContext('webgpu');
        if (!ctx) return;
        this.ctx = ctx;
        const format = navigator.gpu.getPreferredCanvasFormat();
        ctx.configure({
          device,
          format,
          alphaMode: 'premultiplied'
        });
        const module = device.createShaderModule({
          code: shader
        });
        this.pipeline = await device.createRenderPipelineAsync({
          layout: 'auto',
          vertex: {
            module,
            entryPoint: 'vert'
          },
          fragment: {
            module,
            entryPoint: 'frag',
            targets: [{
              format,
              blend: {
                color: {
                  srcFactor: 'one',
                  dstFactor: 'one-minus-src-alpha'
                },
                alpha: {
                  srcFactor: 'one',
                  dstFactor: 'one-minus-src-alpha'
                }
              }
            }]
          },
          primitive: {
            topology: 'triangle-list'
          }
        });
        this.buffer = device.createBuffer({
          size: 16,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        this.group = device.createBindGroup({
          layout: this.pipeline.getBindGroupLayout(0),
          entries: [{
            binding: 0,
            resource: {
              buffer: this.buffer
            }
          }]
        });
        this.uniform = new Float32Array(4);
        this.active = true;
        device.lost.then(() => {
          this.active = false;
          this.el.hidden = true;
        });
      } catch {
        this.active = false;
      }
    }
    draw(w, h, t, seed, field, n) {
      if (!this.active) return;
      try {
        if (this.el.width !== w || this.el.height !== h) {
          this.el.width = Math.max(1, w);
          this.el.height = Math.max(1, h);
        }
        this.uniform.set([t, w / Math.max(1, h), seed % 997, field]);
        const d = this.device;
        d.queue.writeBuffer(this.buffer, 0, this.uniform);
        const e = d.createCommandEncoder(),
          pass = e.beginRenderPass({
            colorAttachments: [{
              view: this.ctx.getCurrentTexture().createView(),
              clearValue: {
                r: 0,
                g: 0,
                b: 0,
                a: 0
              },
              loadOp: 'clear',
              storeOp: 'store'
            }]
          });
        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.group);
        pass.draw(6, n);
        pass.end();
        d.queue.submit([e.finish()]);
      } catch {
        this.active = false;
        this.el.hidden = true;
      }
    }
  }
  G.Motes = Motes;
})();
