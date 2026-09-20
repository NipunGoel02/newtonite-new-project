const { pool } = require("../src/db");
const bcrypt = require("bcrypt");

const tags = [
  "JavaScript",
  "React",
  "Node.js",
  "Python",
  "Java",
  "Database",
  "PostgreSQL",
  "MongoDB",
  "AWS",
  "Docker",
  "Machine Learning",
  "Artificial Intelligence",
  "DevOps",
  "Security",
  "Web Development",
];

const topics = [
  "Introduction to",
  "Advanced",
  "Complete Guide to",
  "Practical",
  "Understanding",
  "Building",
  "Optimizing",
  "Designing",
  "Debugging",
  "Modern",
];

const subjects = [
  "Web Applications",
  "REST APIs",
  "Cloud Systems",
  "Data Structures",
  "Algorithms",
  "Database Systems",
  "Authentication",
  "Distributed Systems",
  "Machine Learning",
  "Software Architecture",
];

const generateDocuments = (count) => {
  const documents = [];

  for (let i = 1; i <= count; i++) {
    const tag = tags[i % tags.length];
    const topic = topics[i % topics.length];
    const subject = subjects[i % subjects.length];

    documents.push({
      title: `${topic} ${tag} for ${subject} ${i}`,
      body: `This article explains ${tag} and its practical use in ${subject}.
It covers important concepts, implementation techniques, performance considerations,
security practices, debugging strategies, and real world development patterns.
Developers can use these concepts to build scalable and reliable applications.
Example number ${i} demonstrates how ${tag} can be integrated into modern software systems.`,
      tag,
    });
  }

  return documents;
};

const seed = async () => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const passwordHash = await bcrypt.hash("Admin@123", 12);

    const adminResult = await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (email)
       DO UPDATE SET role = 'admin'
       RETURNING id`,
      [
        "SearchHub Admin",
        "admin@searchhub.com",
        passwordHash,
      ]
    );

    const adminId = adminResult.rows[0].id;

    const tagIds = {};

    for (const tag of tags) {
      const result = await client.query(
        `INSERT INTO tags (name)
         VALUES ($1)
         ON CONFLICT (name)
         DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [tag]
      );

      tagIds[tag] = result.rows[0].id;
    }

    const documents = generateDocuments(500);

    for (const document of documents) {
      const result = await client.query(
        `INSERT INTO documents
         (title, body, author_id, status)
         VALUES ($1, $2, $3, 'pending')
         RETURNING id`,
        [
          document.title,
          document.body,
          adminId,
        ]
      );

      await client.query(
        `INSERT INTO document_tags
         (document_id, tag_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [
          result.rows[0].id,
          tagIds[document.tag],
        ]
      );
    }

    await client.query("COMMIT");

    console.log("Seed completed");
    console.log("Admin email: admin@searchhub.com");
    console.log("Admin password: Admin@123");
    console.log("Documents created:", documents.length);
    console.log("Tags created:", tags.length);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", error);
  } finally {
    client.release();
    await pool.end();
  }
};

seed();