// src/api/community.js
import client, { getErrMsg } from "./client";

/* ------------------------------------------
 * 내부 유틸: 후보 URL들을 순차 시도
 * ------------------------------------------ */
async function tryGet(candidates) {
  let lastErr;
  for (const c of candidates) {
    try {
      const res = await client.get(c.url, c.config);
      if (res?.status >= 200 && res.status < 300) {
        return { res, usedUrl: c.url };
      }
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("모든 GET 후보 실패");
}

async function tryDelete(candidates) {
  let lastErr;
  for (const c of candidates) {
    try {
      const res = await client.delete(c.url, c.config);
      if (res?.status >= 200 && res.status < 300) {
        return { res, usedUrl: c.url };
      }
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("모든 DELETE 후보 실패");
}

/* ------------------------------------------
 * 리스트 응답 정규화
 *  - 배열은 그대로
 *  - {items:[]}, {content:[]}, {data:{items:[]}} 등 대응
 * ------------------------------------------ */
function normalizeList(data) {
  if (Array.isArray(data)) return data;

  const keys = ["items", "content", "rows", "list", "results", "data"];
  for (const k of keys) {
    const v = data?.[k];
    if (Array.isArray(v)) return v;
    if (v && typeof v === "object") {
      const inner = normalizeList(v);
      if (Array.isArray(inner)) return inner;
    }
  }
  return [];
}

/* ------------------------------------------
 * 게시글 목록 (관리자 우선)
 *  - admin: 숨김 필터/검색/페이지 모두 지원
 *  - public: 숨김 제외, hidden 파라미터는 제거
 * ------------------------------------------ */
export async function fetchPosts(params = {}) {
  const { q, page, size, hidden } = params;

  const hiddenBool =
    typeof hidden === "string" ? hidden.toLowerCase() === "true" : !!hidden;

  const adminParams = {
    q: q ?? undefined,
    page: typeof page === "number" ? page : 0,
    size: typeof size === "number" ? size : 20,
    hidden: hiddenBool ? true : undefined,
  };

  const publicParams = {
    q: q ?? undefined,
    page: typeof page === "number" ? page : 0,
    size: typeof size === "number" ? size : 20,
  };

  const candidates = [
    { url: "/admin/posts", config: { params: adminParams } },
    { url: "/posts",       config: { params: publicParams } },
  ];

  const { res } = await tryGet(candidates);
  const data = res?.data;

  return {
    items: normalizeList(data),
    total:
      typeof data?.total === "number"
        ? data.total
        : Array.isArray(data)
        ? data.length
        : data?.totalElements ??
          data?.totalCount ??
          normalizeList(data).length,
  };
}

/* ------------------------------------------
 * 게시글 상세 (관리자 우선)
 * ------------------------------------------ */
export async function fetchPost(id) {
  const candidates = [
    { url: `/admin/posts/${id}` },
    { url: `/posts/${id}` },
  ];
  const { res } = await tryGet(candidates);
  return res?.data ?? null;
}

/* ------------------------------------------
 * 게시글 숨김/노출 (관리자 전용)
 *  - patch 예: { hidden: 1 } / { hidden: true }
 * ------------------------------------------ */
export async function updatePost(id, patch) {
  try {
    const { data } = await client.put(`/admin/posts/${id}`, patch);
    return data;
  } catch (e) {
    throw new Error(getErrMsg(e, "게시글 수정 실패"));
  }
}

/* ------------------------------------------
 * 게시글 삭제: 관리자 우선 → 퍼블릭(id+author)
 * ------------------------------------------ */
export async function deletePost(id, author) {
  try {
    const { data } = await client.delete(`/admin/posts/${id}`);
    return data;
  } catch {
    const { data } = await client.delete(`/posts/${id}`, {
      params: { author },
    });
    return data;
  }
}

/* ------------------------------------------
 * 댓글 목록 (여러 패턴 폴백)
 * ------------------------------------------ */
export async function fetchComments(postId, params = {}) {
  const base = { page: params.page ?? 0, size: params.size ?? 100 };

  const candidates = [
    { url: `/admin/posts/${postId}/comments`, config: { params: base } },
    { url: `/posts/${postId}/comments`,       config: { params: base } },
    { url: `/comments`,                       config: { params: { postId, ...base } } },
    { url: `/admin/comments`,                 config: { params: { postId, ...base } } },
    { url: `/app/comments`,                   config: { params: { postId, ...base } } },
    { url: `/post-comments`,                  config: { params: { postId, ...base } } },
  ];

  try {
    const { res } = await tryGet(candidates);
    return normalizeList(res?.data);
  } catch {
    return [];
  }
}

/* ------------------------------------------
 * 댓글 삭제 (관리자 우선)
 * ------------------------------------------ */
export async function deleteComment(postId, commentId) {
  const candidates = [
    { url: `/admin/posts/${postId}/comments/${commentId}` },
    { url: `/posts/${postId}/comments/${commentId}` },
    { url: `/comments/${commentId}`,       config: { params: { postId } } },
    { url: `/app/comments/${commentId}`,   config: { params: { postId } } },
    { url: `/admin/comments/${commentId}`, config: { params: { postId } } },
  ];

  try {
    const { res } = await tryDelete(candidates);
    return res?.data;
  } catch (e) {
    throw new Error(getErrMsg(e, "댓글 삭제 실패"));
  }
}

/* ------------------------------------------
 * (테스트용) 댓글 등록
 * ------------------------------------------ */
export async function createComment(postId, { author, content }) {
  const { data } = await client.post(`/posts/${postId}/comments`, {
    author,
    content,
  });
  return data;
}
