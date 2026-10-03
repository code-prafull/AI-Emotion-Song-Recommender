import FaceDetection from './components/FaceDetection'

function App() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col justify-center items-center p-4 md:p-8">
      <div className="w-full max-w-7xl space-y-8">
        <FaceDetection />
      </div>
    </div>
  )
}

export default App
