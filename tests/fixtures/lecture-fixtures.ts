// tests/fixtures/lecture-fixtures.ts
import {
  Lecture,
  LectureEntityRelationType,
  LecturePrerequisite,
  CreateLectureDTO,
  LecturePrerequisiteDTO
} from '@/types/models';
import { LECTURE_ENTITY_RELATION_TYPES } from '@/lib/constants';

/**
 * Sample lecture data with all fields for testing
 */
export const sampleLectures: CreateLectureDTO[] = [
  {
    title: "Introduction to Plato",
    description: "An overview of Plato's philosophy and his impact on Western thought.",
    contentUrl: "https://example.com/videos/plato-intro",
    lecturerName: "Michael Sugrue",
    contentType: "video",
    category: "ancient-philosophy",
    order: 1,
    embedAllowed: true,
    sourceAttribution: "Source: Michael Sugrue Lectures",
    preLecturePrompt: "What do you already know about Plato and his philosophy? Have you read any of his works before?",
    initialPrompt: "After watching the lecture, what aspects of Plato's Theory of Forms do you find most compelling or problematic?",
    masteryPrompt: "Explain Plato's Allegory of the Cave and how it relates to his overall epistemology. How does this concept influence later philosophical thought?",
    evaluationPrompt: "Responses should demonstrate clear understanding of the Theory of Forms, Plato's metaphysics, and the relationship between his epistemology and ethics.",
    discussionPrompts: "How does Plato's conception of knowledge differ from modern scientific understandings? Is the world of Forms compatible with contemporary philosophy?"
  },
  {
    title: "Aristotle's Ethics",
    description: "An exploration of Aristotle's Nicomachean Ethics and his concept of virtue.",
    contentUrl: "https://example.com/videos/aristotle-ethics",
    lecturerName: "Michael Sugrue",
    contentType: "video",
    category: "ancient-philosophy",
    order: 2,
    embedAllowed: true,
    sourceAttribution: "Source: Michael Sugrue Lectures",
    preLecturePrompt: "What is your understanding of virtue ethics? How might it differ from consequentialist or deontological approaches?",
    initialPrompt: "Reflect on Aristotle's concept of eudaimonia (the good life). How does it compare to modern conceptions of happiness?",
    masteryPrompt: "Explain Aristotle's doctrine of the mean and provide original examples that illustrate this concept. How does this approach to ethics compare to Plato's?",
    evaluationPrompt: "Responses should demonstrate understanding of Aristotle's virtue ethics, the doctrine of the mean, and how these concepts relate to his overall philosophy.",
    discussionPrompts: "Is Aristotle's virtue ethics applicable in contemporary society? What challenges might it face in modern ethical dilemmas?"
  },
  {
    title: "Augustine and Christian Philosophy",
    description: "An examination of Augustine's synthesis of Christianity and Neoplatonism.",
    contentUrl: "https://example.com/videos/augustine",
    lecturerName: "Michael Sugrue",
    contentType: "video",
    category: "medieval-philosophy",
    order: 1,
    embedAllowed: true,
    sourceAttribution: "Source: Michael Sugrue Lectures",
    preLecturePrompt: "What do you know about the historical context of Augustine's work? How did Neoplatonism influence early Christian thought?",
    initialPrompt: "Discuss Augustine's view on the problem of evil. How does his perspective address the apparent contradiction between the existence of evil and an omnipotent, benevolent God?",
    masteryPrompt: "Analyze Augustine's conception of time and eternity in 'Confessions'. How does his understanding of time relate to his views on God's nature and human existence?",
    evaluationPrompt: "Responses should demonstrate understanding of Augustine's theological framework, his resolution to the problem of evil, and his influence on Western Christianity.",
    discussionPrompts: "How does Augustine's philosophy bridge the classical and medieval worlds? What elements of his thought remain influential in contemporary religious philosophy?"
  },
  {
    title: "Thomas Aquinas and Natural Law",
    description: "A study of Aquinas's synthesis of Aristotelian philosophy and Christian theology.",
    contentUrl: "https://example.com/videos/aquinas",
    lecturerName: "Michael Sugrue",
    contentType: "video",
    category: "medieval-philosophy",
    order: 2,
    embedAllowed: true,
    sourceAttribution: "Source: Michael Sugrue Lectures",
    preLecturePrompt: "What is your understanding of natural law theory? How might it relate to divine command theory?",
    initialPrompt: "How does Aquinas reconcile faith and reason? Discuss the relationship between revelation and philosophical inquiry in his work.",
    masteryPrompt: "Explain Aquinas's Five Ways to prove God's existence. Which do you find most compelling and why? How do they relate to his overall theological project?",
    evaluationPrompt: "Responses should demonstrate understanding of Aquinas's synthesis of Aristotelianism and Christianity, his natural law theory, and his approach to faith and reason.",
    discussionPrompts: "Does natural law theory provide a viable foundation for ethics in a pluralistic society? How might Aquinas respond to contemporary ethical challenges?"
  },
  {
    title: "Descartes and the Beginning of Modern Philosophy",
    description: "An introduction to Cartesian doubt and the turn toward epistemology in modern philosophy.",
    contentUrl: "https://example.com/videos/descartes",
    lecturerName: "Michael Sugrue",
    contentType: "video",
    category: "modern-philosophy",
    order: 1,
    embedAllowed: true,
    sourceAttribution: "Source: Michael Sugrue Lectures",
    preLecturePrompt: "What do you understand by skepticism in philosophy? What kinds of things can we know with certainty?",
    initialPrompt: "Explain Descartes's method of doubt and his famous conclusion 'Cogito, ergo sum'. Why is this significant in the history of philosophy?",
    masteryPrompt: "Analyze Descartes's arguments for the existence of God and the external world. How successful are these arguments in overcoming radical doubt?",
    evaluationPrompt: "Responses should demonstrate understanding of Cartesian skepticism, the cogito argument, mind-body dualism, and their impact on subsequent philosophy.",
    discussionPrompts: "How has Descartes's approach to knowledge influenced modern science? Is his mind-body dualism still defensible in light of contemporary neuroscience?"
  }
];

/**
 * Sample entity relationships for testing
 */
export const sampleEntityRelations = [
  {
    entityId: "entity-plato-id",
    relationType: LECTURE_ENTITY_RELATION_TYPES.INTRODUCES
  },
  {
    entityId: "entity-forms-id",
    relationType: LECTURE_ENTITY_RELATION_TYPES.EXPANDS
  },
  {
    entityId: "entity-allegory-cave-id",
    relationType: LECTURE_ENTITY_RELATION_TYPES.INTRODUCES
  }
];

/**
 * Sample prerequisite relationships for testing
 */
export const samplePrerequisiteScenarios: {
  [key: string]: LecturePrerequisiteDTO[]
} = {
  // Simple linear prerequisite chain: Plato -> Aristotle -> Augustine -> Aquinas -> Descartes
  linearChain: [
    {
      lectureId: "lecture-aristotle-id",
      prerequisiteLectureId: "lecture-plato-id",
      isRequired: true,
      importanceLevel: 4
    },
    {
      lectureId: "lecture-augustine-id",
      prerequisiteLectureId: "lecture-aristotle-id",
      isRequired: true,
      importanceLevel: 3
    },
    {
      lectureId: "lecture-aquinas-id",
      prerequisiteLectureId: "lecture-augustine-id",
      isRequired: true,
      importanceLevel: 5
    },
    {
      lectureId: "lecture-descartes-id",
      prerequisiteLectureId: "lecture-aquinas-id",
      isRequired: true,
      importanceLevel: 4
    }
  ],

  // Branching prerequisites: Multiple lectures require Plato as prerequisite
  multiplePrerequisites: [
    {
      lectureId: "lecture-aristotle-id",
      prerequisiteLectureId: "lecture-plato-id",
      isRequired: true,
      importanceLevel: 5
    },
    {
      lectureId: "lecture-augustine-id",
      prerequisiteLectureId: "lecture-plato-id",
      isRequired: true,
      importanceLevel: 4
    }
  ],

  // Optional prerequisites: Some prerequisites are recommended but not required
  optionalPrerequisites: [
    {
      lectureId: "lecture-aquinas-id",
      prerequisiteLectureId: "lecture-plato-id",
      isRequired: false,
      importanceLevel: 2
    },
    {
      lectureId: "lecture-aquinas-id",
      prerequisiteLectureId: "lecture-aristotle-id",
      isRequired: true,
      importanceLevel: 5
    },
    {
      lectureId: "lecture-aquinas-id",
      prerequisiteLectureId: "lecture-augustine-id",
      isRequired: true,
      importanceLevel: 4
    }
  ]
};

/**
 * Sample circular dependency scenarios for testing
 * These represent invalid states that should be caught
 */
export const circularDependencyScenarios: {
  [key: string]: LecturePrerequisiteDTO[]
} = {
  // Direct circular dependency: A -> B -> A
  directCircular: [
    {
      lectureId: "lecture-aristotle-id",
      prerequisiteLectureId: "lecture-plato-id",
      isRequired: true,
      importanceLevel: 3
    },
    {
      lectureId: "lecture-plato-id",
      prerequisiteLectureId: "lecture-aristotle-id",
      isRequired: true,
      importanceLevel: 3
    }
  ],

  // Indirect circular dependency: A -> B -> C -> A
  indirectCircular: [
    {
      lectureId: "lecture-aristotle-id",
      prerequisiteLectureId: "lecture-plato-id",
      isRequired: true,
      importanceLevel: 4
    },
    {
      lectureId: "lecture-augustine-id",
      prerequisiteLectureId: "lecture-aristotle-id",
      isRequired: true,
      importanceLevel: 4
    },
    {
      lectureId: "lecture-plato-id",
      prerequisiteLectureId: "lecture-augustine-id",
      isRequired: true,
      importanceLevel: 3
    }
  ],

  // Self-reference circular dependency: A -> A
  selfReference: [
    {
      lectureId: "lecture-plato-id",
      prerequisiteLectureId: "lecture-plato-id",
      isRequired: true,
      importanceLevel: 5
    }
  ]
};

/**
 * Sample user progress data for testing prerequisite satisfaction
 */
export const sampleUserProgress = {
  completedLectures: [
    {
      userId: "user-1",
      lectureId: "lecture-plato-id",
      status: "MASTERED",
      completedAt: new Date("2024-01-15")
    },
    {
      userId: "user-1",
      lectureId: "lecture-aristotle-id",
      status: "MASTERED",
      completedAt: new Date("2024-01-20")
    }
  ],
  inProgressLectures: [
    {
      userId: "user-1",
      lectureId: "lecture-augustine-id",
      status: "STARTED",
      lastViewed: new Date("2024-02-01")
    }
  ],
  lockedLectures: [
    {
      userId: "user-1",
      lectureId: "lecture-aquinas-id",
      status: "LOCKED"
    },
    {
      userId: "user-1",
      lectureId: "lecture-descartes-id",
      status: "LOCKED"
    }
  ]
};
