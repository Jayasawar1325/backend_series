import {Router} from 'express'
import { accessRefreshToken, changeUserPassword, getCurrentUser, getUserProfile, getWatchHistory, loginUser, logOutUser, registerUser, updateAccountDetails, updateCoverImage, updateUserAvatar } from '../controllers/user.controller.js';
import {upload} from '../middlewares/multer.middleware.js'
import { verifyJwt } from '../middlewares/auth.middleware.js';
const router=Router()
router.route('/register').post(
    upload.fields([
        {name:'avatar',
            maxCount:1
        },
        {
            name:'coverImage',
            maxCount:1
        }
    ]),
    registerUser)
    router.route('/login').post(loginUser)
    //secured routes
    router.route('/logout').post(verifyJwt, logOutUser)
    router.route('/refresh-token').post(accessRefreshToken)
    router.route('/change-password').post(verifyJwt,changeUserPassword)
    router.route('/current-user').post(verifyJwt,getCurrentUser)
    router.route('/update-account').patch(verifyJwt,updateAccountDetails)
    router.route('/avatar').patch( verifyJwt,upload.single("avatar"),updateUserAvatar)
    router.route('/cover-image').patch(verifyJwt,upload.single('coverImage'),updateCoverImage)
    router.route('/c/:username').get(verifyJwt,getUserProfile)
    router.route('/history').get(verifyJwt,getWatchHistory)
export default router;