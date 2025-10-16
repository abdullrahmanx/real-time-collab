import express from 'express'
const router= express.Router()
import {verifyToken}from '../middlewares/authMiddleware'
import { createWorkspace,
      getWorkspaces,
      getWorkspace,
      updateWorkspace,
      deleteWorkspace, 
      inviteMember,
       acceptInvite,getMembers, 
      updatedMember, removeMember, leaveWorkspace} from '../controllers/workspaceController'
import { validate } from '../middlewares/workspaceValidation'
import {createWorkspaceSchema,updateWorkspaceSchema,inviteSchema,updatedMemberSchema} from '../middlewares/workspaceValidation'

router.post('/',verifyToken,validate(createWorkspaceSchema),createWorkspace)

router.get('/:id',verifyToken,getWorkspace)

router.get('/',verifyToken,getWorkspaces)

router.put('/:id',verifyToken,validate(updateWorkspaceSchema),updateWorkspace)

router.delete('/:id',verifyToken,deleteWorkspace)


router.delete('/leave-workspace/:id',verifyToken,leaveWorkspace)

router.post('/invite',verifyToken,validate(inviteSchema),inviteMember)

router.get('/accept-invite/:token',verifyToken,acceptInvite)

router.get('/members/:id',verifyToken,getMembers)

router.put('/:workspaceId/members/:id',verifyToken,validate(updatedMemberSchema),updatedMember)

router.delete('/:workspaceId/members/:id',verifyToken,removeMember)



export default router

