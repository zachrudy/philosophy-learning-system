import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
          Philosophy Learning System
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          A structured, concept-based approach to learning philosophy through Michael Sugrue's
          lecture series.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
          <Link
            href="/dashboard"
            className="px-8 py-3 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition-colors"
          >
            Start Learning
          </Link>
          <Link
            href="/about"
            className="px-8 py-3 bg-white text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
          >
            About the Project
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-3 text-gray-800">Concept-Based Learning</h2>
            <p className="text-gray-600">
              Organized around philosophical concepts rather than just chronology for deeper
              understanding.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-3 text-gray-800">Active Engagement</h2>
            <p className="text-gray-600">
              Promotes reflection and critical thinking through structured prompts and exercises.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-3 text-gray-800">Mastery-Based Progression</h2>
            <p className="text-gray-600">
              Demonstrate understanding before advancing to more complex philosophical topics.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
