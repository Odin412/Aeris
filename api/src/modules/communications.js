import { HttpError, nowIso, uuid } from "../utils.js";

export class CommunicationService {
  constructor(store) {
    this.store = store;
    this.subscribers = new Map();
    this.store.eventBus.on("feed.post.created", (payload) => this.broadcast(payload.tenantId, payload));
    this.store.eventBus.on("feed.comment.created", (payload) => this.broadcast(payload.tenantId, payload));
    this.store.eventBus.on("tenant.theme.updated", (payload) => this.broadcast(payload.tenantId, payload));
    this.store.eventBus.on("ai.log.created", (payload) => this.broadcast(payload.tenantId, payload));
  }

  createPost({ tenantId, channel, authorId, message }) {
    const id = uuid();
    const post = {
      id,
      tenantId,
      channel,
      authorId,
      message,
      createdAt: nowIso(),
      likes: [],
      comments: [],
    };
    this.store.feedPosts.set(id, post);
    this.store.eventBus.emit("feed.post.created", { type: "feed.post", tenantId, post });
    return post;
  }

  likePost({ tenantId, postId, userId }) {
    const post = this.store.feedPosts.get(postId);
    if (!post || post.tenantId !== tenantId) throw new HttpError(404, "Post not found");
    if (!post.likes.includes(userId)) {
      post.likes.push(userId);
    }
    this.broadcast(tenantId, { type: "feed.like", tenantId, postId, userId });
    return post;
  }

  commentOnPost({ tenantId, postId, authorId, message }) {
    const post = this.store.feedPosts.get(postId);
    if (!post || post.tenantId !== tenantId) throw new HttpError(404, "Post not found");
    const comment = {
      id: uuid(),
      tenantId,
      postId,
      authorId,
      message,
      createdAt: nowIso(),
    };
    post.comments.push(comment);
    this.store.eventBus.emit("feed.comment.created", { type: "feed.comment", tenantId, comment });
    return comment;
  }

  sendDirectMessage({ tenantId, participantIds, senderId, body }) {
    const threadKey = this.threadKey(tenantId, participantIds);
    let thread = this.store.directMessages.get(threadKey);
    if (!thread) {
      thread = { id: uuid(), tenantId, participants: participantIds, messages: [] };
      this.store.directMessages.set(threadKey, thread);
    }
    const message = { id: uuid(), senderId, body, timestamp: nowIso() };
    thread.messages.push(message);
    this.broadcast(tenantId, { type: "direct.message", tenantId, thread });
    return { thread, message };
  }

  threadKey(tenantId, participantIds) {
    return `${tenantId}:${participantIds.sort().join("-")}`;
  }

  subscribe(tenantId, res) {
    if (!this.subscribers.has(tenantId)) {
      this.subscribers.set(tenantId, new Set());
    }
    this.subscribers.get(tenantId).add(res);
    res.on("close", () => {
      this.subscribers.get(tenantId).delete(res);
    });
  }

  broadcast(tenantId, payload) {
    const subs = this.subscribers.get(tenantId);
    if (!subs) return;
    for (const res of subs) {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    }
  }
}
