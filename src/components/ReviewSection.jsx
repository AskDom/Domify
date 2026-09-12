import React, { useState, useEffect, useCallback } from "react";
import { Star } from "lucide-react";
import { useAuth, CSRF_HEADERS } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function StarRating({ value, onChange, readOnly = false, size = 24 }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => !readOnly && onChange?.(star)}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          className={`transition-transform ${!readOnly ? "hover:scale-110 cursor-pointer" : "cursor-default"}`}
          aria-label={`${star} estrella${star > 1 ? "s" : ""}`}
        >
          <Star
            size={size}
            strokeWidth={1.75}
            fill={star <= (hovered || value) ? "currentColor" : "none"}
            className={star <= (hovered || value) ? "text-amber-400" : "text-gray-300 dark:text-gray-600"}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review, isOwn, onDelete }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {review.user?.avatar ? (
            <img
              src={review.user.avatar}
              alt={review.user.name}
              className="w-9 h-9 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-sm flex-shrink-0">
              {review.user?.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{review.user?.name}</p>
            <p className="text-xs text-gray-400">
              {new Date(review.createdAt).toLocaleDateString("es-DO", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StarRating value={review.rating} readOnly size={16} />
          {isOwn && (
            <button
              onClick={() => onDelete(review.id)}
              className="text-red-400 hover:text-red-600 text-xs font-medium transition ml-2"
            >
              Eliminar
            </button>
          )}
        </div>
      </div>
      <p className="text-gray-600 dark:text-gray-300 text-sm mt-3 leading-relaxed">{review.comment}</p>
    </div>
  );
}

export default function ReviewSection({ propertyId, publishedById }) {
  const { currentUser } = useAuth();

  const [reviews,  setReviews]  = useState([]);
  const [average,  setAverage]  = useState(0);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");
  const [showForm, setShowForm] = useState(false);

  const isOwner = currentUser?.id === publishedById;
  const myReview = reviews.find((r) => r.userId === currentUser?.id);

  // ── FETCH ─────────────────────────────────────────────────────────────────
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/reviews/${propertyId}`);
      const data = await res.json();
      if (res.ok) {
        setReviews(data.reviews);
        setAverage(data.average);
        setTotal(data.total);
        // Pre-llenar el formulario si ya tengo reseña
        const mine = data.reviews.find((r) => r.userId === currentUser?.id);
        if (mine) { setMyRating(mine.rating); setMyComment(mine.comment); }
      }
    } finally {
      setLoading(false);
    }
  }, [propertyId, currentUser?.id]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  // ── ENVIAR ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError(""); setSuccess("");
    if (!myRating) { setError("Selecciona una calificación."); return; }
    if (!myComment.trim()) { setError("Escribe un comentario."); return; }

    setSending(true);
    try {
      const res  = await fetch(`${API_URL}/api/reviews/${propertyId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...CSRF_HEADERS },
        body: JSON.stringify({ rating: myRating, comment: myComment }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error al guardar."); return; }
      setSuccess(myReview ? "¡Reseña actualizada!" : "¡Reseña publicada!");
      setShowForm(false);
      fetchReviews();
    } finally {
      setSending(false);
    }
  };

  // ── ELIMINAR ──────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    const res = await fetch(`${API_URL}/api/reviews/${propertyId}`, {
      method: "DELETE",
      credentials: "include",
      headers: CSRF_HEADERS,
    });
    if (res.ok) {
      setMyRating(0); setMyComment(""); setSuccess(""); setShowForm(false);
      fetchReviews();
    }
  };

  // ── DISTRIBUCIÓN DE ESTRELLAS ─────────────────────────────────────────────
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct:   total ? Math.round((reviews.filter((r) => r.rating === star).length / total) * 100) : 0,
  }));

  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
        Calificaciones y reseñas
      </h2>

      {/* ── RESUMEN ── */}
      {!loading && total > 0 && (
        <div className="flex flex-col sm:flex-row gap-6 mb-8 bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col items-center justify-center min-w-[100px]">
            <p className="text-5xl font-black text-gray-900 dark:text-white">{average}</p>
            <StarRating value={Math.round(average)} readOnly size={20} />
            <p className="text-xs text-gray-400 mt-1">{total} reseña{total !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {distribution.map(({ star, count, pct }) => (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="text-gray-500 w-4 text-right">{star}</span>
                <Star size={13} strokeWidth={1.75} fill="currentColor" className="text-amber-400" />
                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-amber-400 h-2 rounded-full transition-all" style={{ width: `${pct}%` }}/>
                </div>
                <span className="text-gray-400 w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── FORMULARIO ── */}
      {currentUser && !isOwner && (
        <div className="mb-6">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition shadow"
            >
              {myReview ? "✏️ Editar tu reseña" : "⭐ Escribir una reseña"}
            </button>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-blue-200 dark:border-blue-800 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                {myReview ? "Editar reseña" : "Tu reseña"}
              </h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Calificación</p>
                <StarRating value={myRating} onChange={setMyRating} size={30} />
              </div>
              <textarea
                value={myComment}
                onChange={(e) => setMyComment(e.target.value)}
                placeholder="Comparte tu experiencia con esta propiedad..."
                rows={4}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              {error   && <p className="text-red-500 text-xs mt-2">{error}</p>}
              {success && <p className="text-green-500 text-xs mt-2">{success}</p>}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleSubmit} disabled={sending}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-semibold transition"
                >
                  {sending ? "Guardando..." : myReview ? "Actualizar" : "Publicar"}
                </button>
                <button
                  onClick={() => { setShowForm(false); setError(""); }}
                  className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-5 py-2 rounded-xl text-sm font-semibold transition hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Cancelar
                </button>
                {myReview && (
                  <button onClick={handleDelete} className="ml-auto text-red-500 hover:text-red-700 text-sm font-medium transition">
                    Eliminar reseña
                  </button>
                )}
              </div>
            </div>
          )}
          {success && !showForm && (
            <p className="text-green-600 dark:text-green-400 text-sm mt-2 font-medium">{success}</p>
          )}
        </div>
      )}

      {!currentUser && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 italic">
          Inicia sesión para dejar una reseña.
        </p>
      )}

      {isOwner && (
        <p className="text-sm text-gray-400 mb-6 italic">No puedes reseñar tu propia propiedad.</p>
      )}

      {/* ── LISTA DE RESEÑAS ── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-2xl h-24 animate-pulse"/>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <p className="text-4xl mb-2">💬</p>
          <p className="text-sm">Sé el primero en reseñar esta propiedad</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              isOwn={review.userId === currentUser?.id}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}