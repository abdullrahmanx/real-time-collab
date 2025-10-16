import express from 'express'

const router= express.Router()
import { verifyToken } from '../middlewares/authMiddleware'
import { createDocument,
    getDocuments,
    getDocument,
    updateDocument,
    deleteDocument } from '../controllers/documentController'

import { getVersions, getVersion, restoreVersion } from '../controllers/documentVersionController'
import {createDocumentSchema, updateDocumentSchema,validate} from '../middlewares/documentValidation'


// Document routes
router.post('/:workspaceId/documents',verifyToken,validate(createDocumentSchema),createDocument)
router.get('/:workspaceId/documents',verifyToken,getDocuments)
router.get('/:workspaceId/documents/:id',verifyToken,getDocument)
router.put('/:workspaceId/documents/:id',verifyToken,validate(updateDocumentSchema),updateDocument)
router.delete('/:workspaceId/documents/:id',verifyToken,deleteDocument)

// Version routes
router.get('/:workspaceId/documents/:id/versions',verifyToken,getVersions)
router.get('/:workspaceId/documents/:id/versions/:versionId',verifyToken,getVersion)
router.put('/:workspaceId/documents/:id/versions/:versionId/restore',verifyToken,restoreVersion)


export default router



 