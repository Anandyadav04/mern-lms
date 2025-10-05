// Mark lesson as complete
export const completeLesson = async (req, res) => {
  const { id } = req.params; // lessonId
  const userId = req.user._id;

  let progress = await UserProgress.findOne({ user: userId, course: req.body.courseId });
  if (!progress) {
    progress = await UserProgress.create({ user: userId, course: req.body.courseId, completedLessons: [] });
  }

  if (!progress.completedLessons.includes(id)) {
    progress.completedLessons.push(id);
    await progress.save();
  }

  res.json({ completedLessons: progress.completedLessons });
};

// Get course progress
export const getCourseProgress = async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user._id;

  const progress = await UserProgress.findOne({ user: userId, course: courseId });
  res.json({ completedLessons: progress?.completedLessons || [] });
};
