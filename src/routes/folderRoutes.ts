import  express  from "express"
import { verifyToken }  from '../middlewares/authMiddleware'
import { createFolder, deleteFolder, getAllFolders, getFolder, updateFolder } from '../controllers/folderController'
import { createFolderSchema, updateFolderSchema, validate } from '../middlewares/folderValdiation'
const router= express.Router()


router.get('/:workspaceId/folders/:id',verifyToken,getFolder)
router.get('/:workspaceId/folders',verifyToken,getAllFolders)
router.post('/:workspaceId/folders',verifyToken,validate(createFolderSchema),createFolder)
router.put('/:workspaceId/folders/:id',verifyToken,validate(updateFolderSchema),updateFolder)
router.delete('/:workspaceId/folders/:id',verifyToken,deleteFolder)



export default router