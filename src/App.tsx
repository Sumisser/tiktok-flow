import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Workflow from "./pages/Workflow";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/workflow/:id" element={<Workflow />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
