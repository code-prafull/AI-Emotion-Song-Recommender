import React, { useState } from 'react'
import FaceDetection from './components/FaceDetection'
import Song from './components/Song'

function App() {
  const [song, setSong] = useState([
    { title: "t1", artist: "a1", url: "tt" },
    { title: "t2", artist: "a2", url: "pl" },
    { title: "t3", artist: "a3", url: "xx" }
  ]);

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col justify-center items-center p-4 md:p-8">
      <div className="w-full max-w-7xl space-y-8">
        <FaceDetection setSong={setSong} />
        {/* Agar aapko Song component alag se bhi display karna ho toh yeh raha */}
        {/* <Song songs={song} /> */}
      </div>
    </div>
  )
}

export default App