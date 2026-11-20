"""Build the offline distribution with Python's standard library."""
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
SHARED = ["kernel", "ecology", "survey", "terrain"]
CORE = ["catalog", "world", "actions", "persistence"]
CLIENT = ["audio", "art", "renderer", "effects", "maps", "words", "interface", "panels", "client"]

def source(names):
    return "\n".join((SRC / (name + ".js")).read_text(encoding="utf8") for name in names)

def main():
    shared = source(SHARED)
    worker_boot = """
self.onmessage = event => {
  const {type,key,data} = event.data;
  if (type === 'terrain') {
    const rgba=G.terrainPixels(data.planet,data.n);
    self.postMessage({type,key,planet:data.planet,n:data.n,buffer:rgba.buffer},[rgba.buffer]);return;
  }
  if (type === 'forecast' || type === 'survey')
    self.postMessage({type,key,data:type === 'survey' ? G.survey(data) : G.forecast(data)});
};
"""
    boot = "\nconst WORKER_BOOT=" + json.dumps(worker_boot, ensure_ascii=False) + ";\n"
    boot += "const WORKER_SOURCE=document.getElementById('genesis-kernel').textContent+WORKER_BOOT;\n"
    js = source(CORE) + boot + source(CLIENT)
    assert not re.search(r"</script", shared + js, re.I)
    html = (SRC / "shell.html").read_text(encoding="utf8")
    license_text = (ROOT / "LICENSE").read_text(encoding="utf8").rstrip()
    html = html.replace("<!--__LICENSE__-->", f"<!--\n{license_text}\n-->")
    html = html.replace("/*__KERNEL__*/", shared)
    html = html.replace("/*__CSS__*/", (SRC / "style.css").read_text(encoding="utf8")).replace("/*__SCRIPT__*/", js)
    out = ROOT / "GENESIS_Beyond_Matter.html"
    out.write_bytes(html.encode("utf8"))
    print(f"{out.name}: {out.stat().st_size:,} bytes")

if __name__ == "__main__":
    main()
