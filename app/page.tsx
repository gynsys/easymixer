import AudioCombiner from "@/components/AudioCombiner";
// import DownloadSection from "@/components/DownloadSection"; // Removed

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8 space-y-8 bg-black">
      <AudioCombiner />

      <footer className="mt-16 text-center text-sm text-gray-600 pb-8">
        <p>Powered by Python + Next.js</p>
      </footer>
    </main>
  );
}
