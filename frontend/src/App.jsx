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
    <div>
      <FaceDetection setSong={setSong} />
      <Song song={song} />
    </div>
  )
}

export default App