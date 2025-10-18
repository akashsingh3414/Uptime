import express from 'express';
import { authMiddleware } from './middleware';
import { prismaClient } from 'db';

const app = express();

app.use(express.json());

app.post("/api/v1/website", authMiddleware, async (req, res) => {
    const userId = req.userId! as String;
    const { url } = req.body;

    const data = await prismaClient.user.create({
        data: {
            userId,
            url,
        }
    })

    return res.json({
        id: data.id,
        status: 201
    })
})

app.get("/api/v1/website/status", authMiddleware, async (req, res) => {
    const websiteId = req.query.websiteId! as String;
    const userId = req.userId;
    const data = await prismaClient.website.findFirst({
        where: {
            id: websiteId,
            userId,
            disabled: false
        },
        include: {
            ticks: true,
        }
    })

    return res.json(data)
})

app.get("/api/v1/websites", authMiddleware, async (req, res) => {
    const userId = req.userId! as String;

    const websites = await prismaClient.website.findMany({
        where: {
            userId,
            disabled: false
        }
    })

    return res.json(websites)
})

app.delete("/api/v1/website", authMiddleware, async (req, res) => {
    const websiteId = req.body.websiteId;
    const userId = req.userId! as String;

    await prismaClient.website.update({
        where: {
            id: websiteId,
            userId
        },
        data: {
            disabled: true
        }
    })

    return res.json({
        message: "Website deleted successfully"
    })
})

app.listen(3000, () => {
  console.log('API server is running on http://localhost:3000');
});