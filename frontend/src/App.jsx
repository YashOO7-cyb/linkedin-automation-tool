import { useState } from "react";
import axios from "axios";

function App() {
  const [file, setFile] = useState(null);
  const [publishAt, setPublishAt] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !publishAt) {
      alert("Please select an image and date/time.");
      return;
    }
    const form = new FormData();
    form.append("image", file);
    form.append("publishAt", publishAt);

    try {
      const res = await axios.post(
        "https://linkedin-automation-tool.onrender.com/create-scheduled-post",
        form
      );
      alert("Scheduled: " + JSON.stringify(res.data));
    } catch (err) {
      console.error(err);
      alert("Error scheduling post");
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Schedule LinkedIn Post</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <input
          type="datetime-local"
          className="border p-2 w-full"
          value={publishAt}
          onChange={(e) => setPublishAt(e.target.value)}
        />
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Schedule</button>
      </form>
    </div>
  );
}

export default App;
