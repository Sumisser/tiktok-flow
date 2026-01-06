import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Workflow from "./pages/Workflow";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/workflow/:id" element={<Workflow />} />
    </Routes>
  );
}

export default App;
