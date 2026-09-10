import ProcessViewport from "@/components/process-viewport";

export default function HomePage() {
  return (
    <main>
      <header style={{ padding: "24px 28px" }}>
        <p style={{ margin: 0, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", opacity: 0.65 }}>
          FoodProcessLab · Foundation
        </p>
        <h1 style={{ margin: "8px 0 6px", fontSize: 34 }}>Sugarcane → Sugar</h1>
        <p style={{ margin: 0, maxWidth: 720, lineHeight: 1.6, opacity: 0.78 }}>
          A process-first 3D learning environment. This first slice connects a real process definition to a simple interactive scene.
        </p>
      </header>
      <ProcessViewport />
    </main>
  );
}
