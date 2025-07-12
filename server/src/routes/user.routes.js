import { Router } from 'express';
import { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword } from '../controllers/user.controllers.js';
import { uploadBook, updateBook, deleteBook, getAllBooks, searchBooks, paginateBooks, downloadBook, previewBook } from '../controllers/book.controllers.js';
import { verifyJWT } from '../middlewares/auth.middlewares.js';
import { upload } from '../middlewares/multer.middlewares.js';

const router = Router();


// user authentication routes

router.route('/register').post(registerUser);

router.route('/login').post(loginUser);

router.route("/logout").post(verifyJWT, logoutUser);
router.route('/change-password').post(verifyJWT, changeCurrentPassword);
router.route('/refresh-token').post(refreshAccessToken);


// book related routes

router.route('/get-all-books').get(getAllBooks);
router.route('/upload').post(verifyJWT, upload.single('file'), uploadBook);
router.route('/update/:id').put(verifyJWT, upload.single('file'), updateBook);
router.route('/delete/:id').delete(verifyJWT, deleteBook);

router.route('/search').get(searchBooks);
router.route('/paginate').get(paginateBooks);
router.route('/download/:id').get(downloadBook);
router.route('/preview/:id', previewBook);


export default router;
