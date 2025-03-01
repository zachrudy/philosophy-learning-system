import Header from '@/components/common/Header';

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-blue-600 text-white">
            <h1 className="text-2xl font-bold">About the Philosophy Learning System</h1>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="prose max-w-none">
              <p className="text-lg">
                The Philosophy Learning System is an educational web application designed to
                provide a structured, concept-based approach to learning philosophy through
                Michael Sugrue's lecture series.
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">Core Principles</h2>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-lg text-blue-600 mb-2">Concept-Based Learning</h3>
                  <p>
                    Organizing knowledge around philosophical concepts rather than just chronology
                    to build a more interconnected understanding.
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-lg text-blue-600 mb-2">Prerequisite Mapping</h3>
                  <p>
                    Ensuring learners have necessary foundational knowledge before advancing to more
                    complex philosophical ideas.
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-lg text-blue-600 mb-2">Active Engagement</h3>
                  <p>
                    Promoting reflection and critical thinking through structured prompts and
                    guided engagement with the material.
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-lg text-blue-600 mb-2">Mastery-Based Progression</h3>
                  <p>
                    Requiring demonstrated understanding before advancing to more complex topics
                    to ensure solid comprehension.
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-lg text-blue-600 mb-2">Knowledge Decay Model</h3>
                  <p>
                    Recognizing and addressing the forgetting curve through timely review and
                    spaced repetition techniques.
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-lg text-blue-600 mb-2">AI-Enhanced Feedback</h3>
                  <p>
                    Using AI to evaluate understanding and provide personalized guidance on
                    philosophical reflections and exercises.
                  </p>
                </div>
              </div>

              <h2 className="text-xl font-semibold mt-8 mb-4">About Michael Sugrue</h2>
              <p>
                Michael Sugrue was an American academic who taught at Princeton University, Columbia University,
                and Ave Maria University. His lecture series on philosophy has become widely appreciated for its
                accessibility, depth, and engaging style. The Philosophy Learning System is built around his
                lectures to provide a structured way to engage with these valuable resources.
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">Technical Implementation</h2>
              <p>
                The Philosophy Learning System is built using modern web technologies including Next.js,
                TypeScript, and a relational database with Prisma ORM. The architecture follows MVC principles
                for clean separation of concerns and maintainability.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
