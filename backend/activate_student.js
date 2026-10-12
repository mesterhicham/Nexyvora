const db = require('./config/db');
const crypto = require('crypto');

async function seed() {
  try {
    let progId;
    const [existingProgs] = await db.execute('SELECT id FROM programs LIMIT 1');
    if (existingProgs.length > 0) {
      progId = existingProgs[0].id;
    } else {
      progId = crypto.randomUUID();
      await db.execute(
        'INSERT INTO programs (id, name, description, duration) VALUES (?, ?, ?, ?)',
        [progId, 'Informatique & Ingénierie Logicielle', 'Formation complète en ingénierie logicielle et technologies modernes', '3 Ans']
      );
    }
    console.log('Program ID:', progId);

    let specId;
    const [existingSpecs] = await db.execute('SELECT id FROM specialties LIMIT 1');
    if (existingSpecs.length > 0) {
      specId = existingSpecs[0].id;
    } else {
      specId = crypto.randomUUID();
      await db.execute(
        'INSERT INTO specialties (id, name, program_id, description) VALUES (?, ?, ?, ?)',
        [specId, 'Développement Web & Mobile', progId, 'Spécialité orientée applications web modernes et mobiles']
      );
    }
    console.log('Specialty ID:', specId);

    let cohortId;
    const [existingCohorts] = await db.execute('SELECT id FROM cohorts LIMIT 1');
    if (existingCohorts.length > 0) {
      cohortId = existingCohorts[0].id;
    } else {
      cohortId = crypto.randomUUID();
      await db.execute(
        'INSERT INTO cohorts (id, name, specialty_id, start_date, end_date) VALUES (?, ?, ?, ?, ?)',
        [cohortId, 'Promotion 2026', specId, '2026-09-01', '2027-06-30']
      );
    }
    console.log('Cohort ID:', cohortId);

    // Update student
    await db.execute(
      'UPDATE students SET cohort_id = ?, status = ?, enrollment_date = ? WHERE user_id = ?',
      [cohortId, 'active', '2026-09-01', 'fc831146-6347-4168-ab54-356b1d0a522a']
    );
    console.log('Student updated successfully!');

    // Get student ID
    const [stu] = await db.execute('SELECT id FROM students WHERE user_id = ?', ['fc831146-6347-4168-ab54-356b1d0a522a']);
    const studentId = stu[0].id;

    // Insert student placement test result so enrollment check passes
    const testId = crypto.randomUUID();
    await db.execute(
      `INSERT INTO student_test_results (id, student_id, answers, score, total_points, assigned_program_id, completed_at) 
       VALUES (?, ?, ?, 100, 100, ?, NOW()) 
       ON DUPLICATE KEY UPDATE assigned_program_id = VALUES(assigned_program_id)`,
      [testId, studentId, JSON.stringify([]), progId]
    );
    console.log('Placement test result saved!');

    // Check if payments exist
    const [existingPayments] = await db.execute('SELECT id FROM payments WHERE student_id = ?', [studentId]);
    if (existingPayments.length === 0) {
      const payId = crypto.randomUUID();
      await db.execute(
        `INSERT INTO payments (id, student_id, program_id, amount, currency, payment_method, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [payId, studentId, progId, 1500.00, 'MAD', 'virement', 'approved']
      );
      console.log('Payment inserted!');
    } else {
      await db.execute(
        'UPDATE payments SET status = "approved" WHERE student_id = ?',
        [studentId]
      );
      console.log('Payment marked approved!');
    }

    // Also update any modules without specialty to this specialty
    await db.execute(
      'UPDATE modules SET specialty_id = ? WHERE specialty_id IS NULL',
      [specId]
    );

    console.log('ALL DONE SUCCESSFULLY');
    process.exit(0);
  } catch (err) {
    console.error('Error during seed:', err);
    process.exit(1);
  }
}

seed();
