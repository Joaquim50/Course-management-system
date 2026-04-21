import prisma from './prisma';
import bcrypt from 'bcrypt';

async function main() {
  console.log('--- Database Reset & Professional Reseed Started ---');

  // 1. Cleanup assessment-related tables (Reverse Dependency Order)
  console.log('Cleaning up existing data...');
  await prisma.attemptAnswer.deleteMany({});
  await prisma.attempt.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.test.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('Cleanup complete.');

  console.log('Creating default users...');
  const adminPassword = await bcrypt.hash('admin', 10);
  const studentPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@lms.local',
      password: adminPassword,
      role: 'ADMIN'
    }
  });

  const studentUser = await prisma.user.create({
    data: {
      name: 'Default Student',
      email: 'student@lms.local',
      password: studentPassword,
      role: 'STUDENT'
    }
  });
  console.log('Default users created.');

  const student = studentUser;

  const courses = [
    {
      title: 'Modern Web Development with Next.js 14',
      description: 'Master the latest Next.js features including the App Router, React Server Components (RSC), and Server Actions for building scalable full-stack applications.',
      level: 'Intermediate',
      duration: '10 Hours',
      thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=800',
      materialUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      learningObjectives: ['App Router Navigation', 'Server Components vs Client Components', 'Advanced Caching Patterns', 'Form handling with Server Actions'],
      pretest: [
        {
          questionText: 'Which directive is used to mark a file as a Client Component?',
          options: ['"use browser"', '"use client"', '"client-side"', '"render:client"'],
          correctAnswer: '"use client"'
        }
      ],
      exam: [
        {
          questionText: 'What is the default rendering paradigm for components in the Next.js App Router?',
          options: ['Client Components', 'Server Components', 'Static Generation', 'Isomorphic Components'],
          correctAnswer: 'Server Components'
        },
        {
          questionText: 'How do you perform data revalidation in the App Router?',
          options: ['revalidatePath()', 'refreshData()', 'updateCache()', 'fetch.revalidate()'],
          correctAnswer: 'revalidatePath()'
        },
        {
          questionText: 'Which file is used to define a shared UI that persists across multiple routes?',
          options: ['page.tsx', 'template.tsx', 'layout.tsx', 'common.tsx'],
          correctAnswer: 'layout.tsx'
        },
        {
          questionText: 'What is the purpose of the "loading.tsx" file?',
          options: ['Configures data fetching', 'Handles API errors', 'Shows a fallback UI during navigation', 'Specifies images to preload'],
          correctAnswer: 'Shows a fallback UI during navigation'
        },
        {
          questionText: 'Can Server Components manage state using useState?',
          options: ['Yes, always', 'Only with a special hook', 'No, Server Components don\'t support state hooks', 'Only in development mode'],
          correctAnswer: 'No, Server Components don\'t support state hooks'
        }
      ]
    },
    {
      title: 'Advanced TypeScript for Enterprise Apps',
      description: 'Go beyond basic types. Learn Generics, Conditional Types, Utility Types, and advanced patterns for building typesafe large-scale applications.',
      level: 'Advanced',
      duration: '8 Hours',
      thumbnailUrl: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&q=80&w=800',
      materialUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      learningObjectives: ['Advanced Generics', 'Mapped and Conditional Types', 'Type Narrowing Techniques', 'Utility Types Mastery'],
      pretest: [
        {
          questionText: 'Which keyword is used to create a type that depends on another type?',
          options: ['extends', 'typeof', 'infer', 'is'],
          correctAnswer: 'infer'
        }
      ],
      exam: [
        {
          questionText: 'What does the "Partial<T>" utility type do?',
          options: ['Makes all properties read-only', 'Removes all properties from T', 'Makes all properties of T optional', 'Extracts specific keys from T'],
          correctAnswer: 'Makes all properties of T optional'
        },
        {
          questionText: 'What is a "Discriminated Union" in TypeScript?',
          options: ['A union of types that share a literal property', 'A type that can never occur', 'A private class member', 'An array of multiple types'],
          correctAnswer: 'A union of types that share a literal property'
        },
        {
          questionText: 'How do you check if a variable matches a specific type at runtime (Type Guard)?',
          options: ['Using "as" keyword', 'Using "is" in function return type', 'Using "typeOf" decorator', 'It\'s impossible in TS'],
          correctAnswer: 'Using "is" in function return type'
        },
        {
          questionText: 'What is the "unknown" type?',
          options: ['The same as "any"', 'A typesafe alternative to "any"', 'A type for variables that don\'t exist', 'The type of null and undefined'],
          correctAnswer: 'A typesafe alternative to "any"'
        },
        {
          questionText: 'What is the purpose of the "keyof" operator?',
          options: ['Accesses a value of an object', 'Returns a union of keys of a type', 'Defines a new key in an interface', 'Checks if a key exists'],
          correctAnswer: 'Returns a union of keys of a type'
        }
      ]
    },
    {
      title: 'Cloud Native Architecture with AWS',
      description: 'Master the core AWS services used in modern cloud-native apps: Lambda, S3, DynamoDB, VPC, and API Gateway.',
      level: 'Advanced',
      duration: '15 Hours',
      learningObjectives: ['Serverless with Lambda', 'Scalable storage in S3', 'NoSQL with DynamoDB', 'Networking with VPC'],
      pretest: [
        {
          questionText: 'Which AWS service is best suited for serverless computing?',
          options: ['EC2', 'Lambda', 'RDS', 'S3'],
          correctAnswer: 'Lambda'
        }
      ],
      exam: [
        {
          questionText: 'What is the primary characteristic of DynamoDB?',
          options: ['Relational database', 'NoSQL, low-latency, key-value and document database', 'A data warehousing service', 'An object storage service'],
          correctAnswer: 'NoSQL, low-latency, key-value and document database'
        },
        {
          questionText: 'Which service allows you to distribute incoming application traffic across multiple targets?',
          options: ['Route 53', 'IAM', 'Elastic Load Balancing (ELB)', 'CloudFront'],
          correctAnswer: 'Elastic Load Balancing (ELB)'
        },
        {
          questionText: 'What does "IAM" stand for in AWS?',
          options: ['Internal Account Manager', 'Identity and Access Management', 'Instance Allocation Module', 'Indexed Application Metrics'],
          correctAnswer: 'Identity and Access Management'
        },
        {
          questionText: 'Which AWS service is used as a content delivery network (CDN)?',
          options: ['S3', 'CloudWatch', 'CloudFront', 'VPC'],
          correctAnswer: 'CloudFront'
        },
        {
          questionText: 'In DynamoDB, what is used to uniquely identify an item?',
          options: ['Sort Key', 'Primary Key', 'Foreign Key', 'Global Secondary Index'],
          correctAnswer: 'Primary Key'
        }
      ]
    },
    {
      title: 'UI/UX Design Systems with Figma',
      description: 'Learn to build professional design systems from scratch. Master Auto Layout, Components, Variants, and Prototyping.',
      level: 'Beginner',
      duration: '6 Hours',
      learningObjectives: ['Design Consistency', 'Building Component Libraries', 'Advanced Auto Layout', 'Interactive Prototyping'],
      pretest: [
        {
          questionText: 'What is the shortcut for creating a Component in Figma?',
          options: ['Cmd + R', 'Alt + Cmd + K', 'Ctrl + G', 'Shift + A'],
          correctAnswer: 'Alt + Cmd + K'
        }
      ],
      exam: [
        {
          questionText: 'What feature allows a component to behave like a flexbox container?',
          options: ['Constraints', 'Auto Layout', 'Grids', 'Slicing'],
          correctAnswer: 'Auto Layout'
        },
        {
          questionText: 'What are "Variants" used for in Figma?',
          options: ['Creating different colors of design', 'Grouping similar components with different properties', 'Exporting different file formats', 'Debugging design errors'],
          correctAnswer: 'Grouping similar components with different properties'
        },
        {
          questionText: 'How do you share a design system across multiple Figma files?',
          options: ['Copy and paste', 'Using the Assets panel with a Team Library', 'Exporting as PDF', 'Inviting users to the file'],
          correctAnswer: 'Using the Assets panel with a Team Library'
        },
        {
          questionText: 'What is "Smart Animate" in Figma prototyping?',
          options: ['An AI that designs layouts', 'A feature that identifies layers and animates differences in properties', 'A way to speed up export', 'A plugin for video editing'],
          correctAnswer: 'A feature that identifies layers and animates differences in properties'
        },
        {
          questionText: 'What is the difference between an Instance and a Main Component?',
          options: ['Instances cannot be edited', 'Main Component is the source of truth; changes sync to Instances', 'There is no difference', 'Instances are for web, Main is for mobile'],
          correctAnswer: 'Main Component is the source of truth; changes sync to Instances'
        }
      ]
    },
    {
      title: 'Data Science & Machine Learning with Python',
      description: 'Learn data analysis with Pandas, visualization with Matplotlib, and predictive modeling with Scikit-learn.',
      level: 'Intermediate',
      duration: '20 Hours',
      learningObjectives: ['Data Cleaning with Pandas', 'Exploratory Data Analysis', 'Supervised Learning', 'Model Evaluation Metrics'],
      pretest: [
        {
          questionText: 'Which library is primarily used for data manipulation in Python?',
          options: ['Matplotlib', 'Pandas', 'Flask', 'Numpy'],
          correctAnswer: 'Pandas'
        }
      ],
      exam: [
        {
          questionText: 'What is the purpose of train_test_split?',
          options: ['To duplicate the data', 'To separate data into training and evaluation sets', 'To normalize numerical values', 'To remove outliers'],
          correctAnswer: 'To separate data into training and evaluation sets'
        },
        {
          questionText: 'Which algorithm is commonly used for Linear Regression?',
          options: ['K-Means', 'Decision Trees', 'Ordinary Least Squares', 'Random Forest'],
          correctAnswer: 'Ordinary Least Squares'
        },
        {
          questionText: 'What is "Overfitting" in Machine Learning?',
          options: ['When a model performs well on training but poorly on new data', 'When a model is too simple', 'When the dataset is too small', 'When the model training is too fast'],
          correctAnswer: 'When a model performs well on training but poorly on new data'
        },
        {
          questionText: 'Which of these is a classification metric?',
          options: ['Mean Squared Error', 'F1 Score', 'R-Squared', 'Absolute Error'],
          correctAnswer: 'F1 Score'
        },
        {
          questionText: 'What is the main advantage of a Random Forest over a Single Decision Tree?',
          options: ['It is faster to train', 'It reduces overfitting by averaging multiple trees', 'It is easier to visualize', 'It uses less memory'],
          correctAnswer: 'It reduces overfitting by averaging multiple trees'
        }
      ]
    },
    {
      title: 'Cybersecurity Fundamentals: Zero Trust',
      description: 'Learn the principles of Zero Trust security, network segmentation, multi-factor authentication, and threat modeling.',
      level: 'Intermediate',
      duration: '12 Hours',
      learningObjectives: ['Zero Trust Principles', 'Identity Management', 'Endpoint Security', 'Data Encryption'],
      pretest: [
        {
          questionText: 'What is the core motto of Zero Trust?',
          options: ['Trust but verify', 'Trust no one, verify everyone', 'Always trust internal users', 'Security through obscurity'],
          correctAnswer: 'Trust no one, verify everyone'
        }
      ],
      exam: [
        {
          questionText: 'What does MFA stand for?',
          options: ['Major File Access', 'Multi-Factor Authentication', 'Main Framework Architecture', 'Minimal Functional Access'],
          correctAnswer: 'Multi-Factor Authentication'
        },
        {
          questionText: 'What is "least privilege access"?',
          options: ['Giving everyone admin rights', 'Giving users only the access they need for their job', 'Restricting internet access', 'Hiding company files'],
          correctAnswer: 'Giving users only the access they need for their job'
        },
        {
          questionText: 'Which of these is a common social engineering attack?',
          options: ['SQL Injection', 'DDoS', 'Phishing', 'Buffer Overflow'],
          correctAnswer: 'Phishing'
        },
        {
          questionText: 'What is the purpose of a Firewall in a Zero Trust environment?',
          options: ['It is no longer needed', 'To monitor and segment internal and external traffic', 'To encrypt hard drives', 'To manage employee passwords'],
          correctAnswer: 'To monitor and segment internal and external traffic'
        },
        {
          questionText: 'What is "Encryption at Rest"?',
          options: ['Protecting data as it travels over the web', 'Protecting data while it is stored on a disk', 'Hiding data from search engines', 'Deleting data after use'],
          correctAnswer: 'Protecting data while it is stored on a disk'
        }
      ]
    },
    {
      title: 'Mobile App Development with Flutter',
      description: 'Build high-performance cross-platform apps for iOS and Android using the Dart language and Flutter framework.',
      level: 'Beginner',
      duration: '18 Hours',
      learningObjectives: ['Dart Basics', 'Widget Tree Architecture', 'State Management', 'Native Integration'],
      pretest: [
        {
          questionText: 'Which programming language is used by Flutter?',
          options: ['JavaScript', 'Java', 'Dart', 'Swift'],
          correctAnswer: 'Dart'
        }
      ],
      exam: [
        {
          questionText: 'Everything in Flutter is a...?',
          options: ['Module', 'Widget', 'Component', 'Class'],
          correctAnswer: 'Widget'
        },
        {
          questionText: 'What is the difference between StatelessWidget and StatefulWidget?',
          options: ['Stateful can change its UI during runtime based on data', 'Stateless is for iOS, Stateful for Android', 'There is no difference', 'Stateless uses more memory'],
          correctAnswer: 'Stateful can change its UI during runtime based on data'
        },
        {
          questionText: 'How do you trigger a UI rebuild in a StatefulWidget?',
          options: ['refresh()', 'setState()', 'updateView()', 'rebuild()'],
          correctAnswer: 'setState()'
        },
        {
          questionText: 'Which file is used to manage dependencies in a Flutter project?',
          options: ['package.json', 'pubspec.yaml', 'config.xml', 'index.html'],
          correctAnswer: 'pubspec.yaml'
        },
        {
          questionText: 'What is "Hot Reload" in Flutter?',
          options: ['A way to overclock the phone', 'Quickly injecting code changes into the app without losing state', 'A server-side rendering technique', 'A security feature'],
          correctAnswer: 'Quickly injecting code changes into the app without losing state'
        }
      ]
    },
    {
      title: 'DevOps Engineering: Docker & Kubernetes',
      description: 'Master containerization and orchestration. Learn to package applications and scale them using Kubernetes.',
      level: 'Advanced',
      duration: '14 Hours',
      learningObjectives: ['Dockerizing Apps', 'Kubernetes Architecture', 'CI/CD Pipelines', 'Monitoring and Logging'],
      pretest: [
        {
          questionText: 'What is a Docker Image?',
          options: ['A photo of a container', 'A read-only template with instructions for creating a container', 'A running instance of an app', 'A virtual machine hardware component'],
          correctAnswer: 'A read-only template with instructions for creating a container'
        }
      ],
      exam: [
        {
          questionText: 'What is Kubernetes?',
          options: ['A programming language', 'An open-source system for automating deployment, scaling, and management of containerized applications', 'A cloud provider like AWS', 'A database engine'],
          correctAnswer: 'An open-source system for automating deployment, scaling, and management of containerized applications'
        },
        {
          questionText: 'What is a "Pod" in Kubernetes?',
          options: ['A group of virtual machines', 'The smallest deployable unit that can contain one or more containers', 'A storage disk', 'A network bridge'],
          correctAnswer: 'The smallest deployable unit that can contain one or more containers'
        },
        {
          questionText: 'What is the command to build an image from a Dockerfile?',
          options: ['docker start', 'docker create', 'docker build', 'docker run'],
          correctAnswer: 'docker build'
        },
        {
          questionText: 'Which Kubernetes component manages scheduling?',
          options: ['etcd', 'kube-proxy', 'kube-scheduler', 'kubelet'],
          correctAnswer: 'kube-scheduler'
        },
        {
          questionText: 'What is the purpose of "docker-compose"?',
          options: ['To write code', 'To define and run multi-container Docker applications', 'To deploy to the cloud', 'To optimize image size'],
          correctAnswer: 'To define and run multi-container Docker applications'
        }
      ]
    },
    {
      title: 'Building Scalable APIs with GraphQL',
      description: 'Go beyond REST. Learn to build efficient and flexible APIs using GraphQL, Apollo Server, and React Apollo Client.',
      level: 'Intermediate',
      duration: '9 Hours',
      learningObjectives: ['GraphQL Schema Definitions', 'Queries and Mutations', 'Resolvers Architecture', 'Advanced Subscriptions'],
      pretest: [
        {
          questionText: 'In GraphQL, which operation is used to fetch data?',
          options: ['Mutation', 'Query', 'Subscription', 'POST'],
          correctAnswer: 'Query'
        }
      ],
      exam: [
        {
          questionText: 'What is the main benefit of GraphQL over REST?',
          options: ['It is faster for computers to read', 'Clients can request exactly the data they need, avoiding over-fetching', 'It does not use HTTP', 'It only works with JavaScript'],
          correctAnswer: 'Clients can request exactly the data they need, avoiding over-fetching'
        },
        {
          questionText: 'Which operation is used to modify server-side data?',
          options: ['Update', 'Modify', 'Mutation', 'Query'],
          correctAnswer: 'Mutation'
        },
        {
          questionText: 'What is a "Schema" in GraphQL?',
          options: ['A database table', 'A visual design of the API', 'A formal definition of data types and their relationships', 'An authentication rule'],
          correctAnswer: 'A formal definition of data types and their relationships'
        },
        {
          questionText: 'What are "Resolvers" in GraphQL?',
          options: ['Security patches', 'Functions that fetch the data for a specific field in the schema', 'A way to resolve IP addresses', 'Client-side components'],
          correctAnswer: 'Functions that fetch the data for a specific field in the schema'
        },
        {
          questionText: 'Which type allows you to implement real-time updates?',
          options: ['Stream', 'LiveQuery', 'Subscription', 'Event'],
          correctAnswer: 'Subscription'
        }
      ]
    },
    {
      title: 'AI-Powered Applications with OpenAI API',
      description: 'Learn to build the next generation of apps using Large Language Models. Master prompt engineering, embeddings, and fine-tuning.',
      level: 'Advanced',
      duration: '12 Hours',
      learningObjectives: ['Prompt Engineering Mastery', 'Embeddings and Vector DBs', 'Building AI Chatbots', 'Fine-tuning Models'],
      pretest: [
        {
          questionText: 'What does LLM stand for?',
          options: ['Linked Logic Module', 'Large Language Model', 'Linear Light Metric', 'Logical Learning Machine'],
          correctAnswer: 'Large Language Model'
        }
      ],
      exam: [
        {
          questionText: 'What is "Prompt Engineering"?',
          options: ['Optimizing server code', 'The art of crafting inputs to get the best desired output from an AI', 'Building hardware for AI', 'Designing icons for chatbots'],
          correctAnswer: 'The art of crafting inputs to get the best desired output from an AI'
        },
        {
          questionText: 'What are "Tokens" in the context of OpenAI?',
          options: ['Security keys', 'Units of text the model reads and writes', 'In-app currency', 'Database identifiers'],
          correctAnswer: 'Units of text the model reads and writes'
        },
        {
          questionText: 'What is the purpose of "Temperature" in model settings?',
          options: ['Cpu heat management', 'Controls the randomness or creativity of the output', 'Sets the response time', 'Defines the language level'],
          correctAnswer: 'Controls the randomness or creativity of the output'
        },
        {
          questionText: 'What are Embeddings useful for?',
          options: ['Displaying images', 'Converting text into numerical vectors for similarity search', 'Compiling code', 'Managing user sessions'],
          correctAnswer: 'Converting text into numerical vectors for similarity search'
        },
        {
          questionText: 'Which OpenAI model is currently recognized for the best reasoning capabilities?',
          options: ['gpt-3.5-turbo', 'gpt-4 (and newer)', 'text-davinci-003', 'whisper-1'],
          correctAnswer: 'gpt-4 (and newer)'
        }
      ]
    }
  ];

  for (const c of courses) {
    console.log(`Seeding Course: ${c.title}...`);
    const course = await prisma.course.create({
      data: {
        title: c.title,
        description: c.description,
        level: c.level,
        duration: c.duration,
        thumbnailUrl: c.thumbnailUrl,
        materialUrl: c.materialUrl,
        learningObjectives: JSON.stringify(c.learningObjectives)
      }
    });

    // Create Pretest
    await prisma.test.create({
      data: {
        courseId: course.id,
        type: 'PRETEST',
        Questions: {
          create: c.pretest.map(q => ({
            questionText: q.questionText,
            options: JSON.stringify(q.options),
            correctAnswer: q.correctAnswer
          }))
        }
      }
    });

    // Create Exam
    await prisma.test.create({
      data: {
        courseId: course.id,
        type: 'EXAM',
        Questions: {
          create: c.exam.map(q => ({
            questionText: q.questionText,
            options: JSON.stringify(q.options),
            correctAnswer: q.correctAnswer
          }))
        }
      }
    });
  }

  console.log('--- Database Reseed Complete ---');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
