import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import studentsRouter from "./students";
import facultyRouter from "./faculty";
import departmentsRouter from "./departments";
import subjectsRouter from "./subjects";
import attendanceRouter from "./attendance";
import timetableRouter from "./timetable";
import assignmentsRouter from "./assignments";
import quizzesRouter from "./quizzes";
import resultsRouter from "./results";
import materialsRouter from "./materials";
import noticesRouter from "./notices";
import eventsRouter from "./events";
import leavesRouter from "./leaves";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(studentsRouter);
router.use(facultyRouter);
router.use(departmentsRouter);
router.use(subjectsRouter);
router.use(attendanceRouter);
router.use(timetableRouter);
router.use(assignmentsRouter);
router.use(quizzesRouter);
router.use(resultsRouter);
router.use(materialsRouter);
router.use(noticesRouter);
router.use(eventsRouter);
router.use(leavesRouter);
router.use(dashboardRouter);

export default router;
