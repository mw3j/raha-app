import React, { useState, useEffect } from 'react';
import { useGetAdminStats, useGetUsers, useToggleUserActive, useMakeUserAdmin, useCreatePost } from '@workspace/api-client-react';
import { useAuth } from '@/hooks/use-auth';
import { Card, Badge, Button, Input } from '@/components/ui';
import { Users, FileText, Activity, ShieldCheck, Search, Shield, ShieldOff, Trash2, Plus, X, MessageCircle, Bug, Lightbulb, HelpCircle, MoreHorizontal, ChevronDown, ChevronUp, CheckCircle, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { apiFetch } from '@/lib/api';

const TICKET_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  bug: { label: 'مشكلة', color: 'text-red-500 bg-red-50 dark:bg-red-950/30' },
  suggestion: { label: 'اقتراح', color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30' },
  question: { label: 'استفسار', color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30' },
  other: { label: 'أخرى', color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/30' },
};

const TICKET_STATUS_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  open: { label: 'جديدة', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40', icon: MessageCircle },
  in_progress: { label: 'قيد المعالجة', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40', icon: Clock },
  resolved: { label: 'تم الحل', color: 'text-green-600 bg-green-50 dark:bg-green-950/40', icon: CheckCircle },
  closed: { label: 'مغلقة', color: 'text-gray-600 bg-gray-100 dark:bg-gray-800', icon: XCircle },
};

function SupportTicketsPanel() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [adminNote, setAdminNote] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<number | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const data = await apiFetch(`/api/support${params}`);
      setTickets(data.tickets || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchTickets(); }, [statusFilter]);

  const updateTicket = async (id: number, status?: string, note?: string) => {
    setSaving(id);
    try {
      await apiFetch(`/api/support/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...(status ? { status } : {}),
          ...(note !== undefined ? { adminNote: note } : {}),
        }),
      });
      await fetchTickets();
    } catch {}
    setSaving(null);
  };

  const deleteTicket = async (id: number) => {
    if (!confirm('هل تريد حذف هذه الرسالة؟')) return;
    try {
      await apiFetch(`/api/support/${id}`, { method: 'DELETE' });
      setTickets(t => t.filter(x => x.id !== id));
    } catch {}
  };

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'all', label: 'الكل' },
          { id: 'open', label: 'جديدة' },
          { id: 'in_progress', label: 'قيد المعالجة' },
          { id: 'resolved', label: 'تم الحل' },
          { id: 'closed', label: 'مغلقة' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${statusFilter === f.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array(3).fill(0).map((_, i) => <Card key={i} className="h-16 animate-pulse bg-muted" />)}</div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">لا توجد رسائل</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const typeInfo = TICKET_TYPE_LABELS[ticket.type] || TICKET_TYPE_LABELS.other;
            const statusInfo = TICKET_STATUS_LABELS[ticket.status] || TICKET_STATUS_LABELS.open;
            const StatusIcon = statusInfo.icon;
            const isExpanded = expanded === ticket.id;

            return (
              <Card key={ticket.id} className="overflow-hidden">
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => {
                    setExpanded(isExpanded ? null : ticket.id);
                    if (!adminNote[ticket.id]) setAdminNote(n => ({ ...n, [ticket.id]: ticket.adminNote || '' }));
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${typeInfo.color}`}>{typeInfo.label}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="font-bold text-sm truncate">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{ticket.name} · <span dir="ltr">{ticket.email}</span></p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground">{format(new Date(ticket.createdAt), 'MM/dd')}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3 animate-in slide-in-from-top-2 duration-200">
                    <p className="text-sm leading-relaxed bg-secondary/40 rounded-xl p-3">{ticket.message}</p>

                    {/* Status changer */}
                    <div>
                      <p className="text-xs font-bold text-muted-foreground mb-2">تغيير الحالة:</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {Object.entries(TICKET_STATUS_LABELS).map(([key, val]) => (
                          <button
                            key={key}
                            disabled={saving === ticket.id}
                            onClick={() => updateTicket(ticket.id, key)}
                            className={`text-xs px-3 py-1.5 rounded-full font-bold transition-all ${ticket.status === key ? val.color + ' ring-2 ring-offset-1 ring-current' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}
                          >
                            {val.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Admin note */}
                    <div>
                      <p className="text-xs font-bold text-muted-foreground mb-1.5">ملاحظة داخلية:</p>
                      <textarea
                        className="w-full text-sm p-2.5 rounded-xl border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 text-right"
                        rows={2}
                        placeholder="أضف ملاحظة..."
                        dir="rtl"
                        value={adminNote[ticket.id] ?? ticket.adminNote ?? ''}
                        onChange={e => setAdminNote(n => ({ ...n, [ticket.id]: e.target.value }))}
                      />
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          className="flex-1 text-xs"
                          disabled={saving === ticket.id}
                          onClick={() => updateTicket(ticket.id, undefined, adminNote[ticket.id])}
                        >
                          {saving === ticket.id ? 'جاري الحفظ...' : 'حفظ الملاحظة'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs text-red-500 border-red-200 hover:bg-red-50"
                          onClick={() => deleteTicket(ticket.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

const CATEGORIES = ['حديث', 'دعاء', 'فقه', 'سيرة', 'تفسير', 'عام'];

function CreatePostModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('عام');
  const [imageUrl, setImageUrl] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [error, setError] = useState('');

  const createPost = useCreatePost({
    mutation: {
      onSuccess: () => {
        onSuccess();
        onClose();
      },
      onError: (err: any) => {
        setError(err?.message || 'حدث خطأ أثناء إنشاء المنشور');
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('العنوان والمحتوى مطلوبان');
      return;
    }
    createPost.mutate({
      data: {
        title: title.trim(),
        content: content.trim(),
        category,
        imageUrl: imageUrl.trim() || undefined,
        isPublished,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-background rounded-t-3xl p-6 space-y-5 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">إضافة منشور جديد</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-xl border border-destructive/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1.5 text-muted-foreground">العنوان *</label>
            <Input
              placeholder="عنوان المنشور..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-secondary/50"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1.5 text-muted-foreground">التصنيف</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                    category === cat ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-1.5 text-muted-foreground">المحتوى *</label>
            <textarea
              placeholder="اكتب محتوى المنشور هنا..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[120px] bg-secondary/50 border border-input rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1.5 text-muted-foreground">رابط الصورة (اختياري)</label>
            <Input
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="bg-secondary/50"
              dir="ltr"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
            <span className="font-bold text-sm">نشر مباشرة</span>
            <button
              type="button"
              onClick={() => setIsPublished(!isPublished)}
              className={`w-12 h-6 rounded-full transition-colors relative ${isPublished ? 'bg-primary' : 'bg-muted'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${isPublished ? 'right-0.5' : 'left-0.5'}`} />
            </button>
          </div>

          <Button
            type="submit"
            className="w-full"
            isLoading={createPost.isPending}
          >
            نشر المنشور
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'posts' | 'support'>('stats');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  const { data: stats } = useGetAdminStats();
  const { data: usersData, refetch: refetchUsers } = useGetUsers({ limit: 100 });

  const toggleActiveMutation = useToggleUserActive({ mutation: { onSuccess: () => refetchUsers() } });
  const makeAdminMutation = useMakeUserAdmin({ mutation: { onSuccess: () => refetchUsers() } });

  const fetchAllPosts = async () => {
    setLoadingPosts(true);
    try {
      const data = await apiFetch('/api/posts/admin/all');
      setAllPosts(data.posts || []);
    } catch { } finally { setLoadingPosts(false); }
  };

  React.useEffect(() => {
    if (activeTab === 'posts') fetchAllPosts();
  }, [activeTab]);

  const approvePost = async (postId: number, approve: boolean) => {
    setApprovingId(postId);
    try {
      await apiFetch(`/api/posts/${postId}`, {
        method: 'PUT',
        body: JSON.stringify({ isPublished: approve }),
      });
      setAllPosts(prev => prev.map(p => p.id === postId ? { ...p, isPublished: approve } : p));
    } catch { alert('فشل تحديث المنشور'); } finally { setApprovingId(null); }
  };

  const deletePostDirect = async (postId: number) => {
    if (!confirm('هل تريد حذف هذا المنشور؟')) return;
    try {
      await apiFetch(`/api/posts/${postId}`, { method: 'DELETE' });
      setAllPosts(prev => prev.filter(p => p.id !== postId));
      setDeletingPostId(null);
    } catch { alert('فشل حذف المنشور'); }
  };

  if (user?.role !== 'admin' && user?.role !== 'superadmin') {
    return <div className="p-8 text-center text-destructive font-bold">غير مصرح لك بالوصول</div>;
  }

  const isSuperAdmin = user?.role === 'superadmin';

  const filteredUsers = usersData?.users.filter(
    (u) => u.name.includes(searchUser) || u.email.includes(searchUser)
  ) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {showCreatePost && (
        <CreatePostModal onClose={() => setShowCreatePost(false)} onSuccess={() => fetchAllPosts()} />
      )}

      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="w-8 h-8 text-primary" />
        <h2 className="text-2xl font-bold">إدارة التطبيق</h2>
        {isSuperAdmin && (
          <Badge variant="gold" className="text-xs px-2 py-0.5">سوبر أدمن</Badge>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'stats', label: 'الإحصائيات', icon: Activity },
          { id: 'users', label: 'المستخدمين', icon: Users },
          { id: 'posts', label: 'المنشورات', icon: FileText },
          { id: 'support', label: 'رسائل الدعم', icon: MessageCircle },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'stats' && stats && (
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-5 border-t-4 border-t-primary">
            <Users className="w-6 h-6 text-primary mb-2" />
            <p className="text-sm text-muted-foreground mb-1">إجمالي المستخدمين</p>
            <h3 className="text-3xl font-bold">{stats.totalUsers}</h3>
          </Card>
          <Card className="p-5 border-t-4 border-t-gold">
            <Activity className="w-6 h-6 text-gold mb-2" />
            <p className="text-sm text-muted-foreground mb-1">المستخدمين النشطين</p>
            <h3 className="text-3xl font-bold">{stats.activeUsers}</h3>
          </Card>
          <Card className="p-5 border-t-4 border-t-emerald-500">
            <FileText className="w-6 h-6 text-emerald-500 mb-2" />
            <p className="text-sm text-muted-foreground mb-1">إجمالي المنشورات</p>
            <h3 className="text-3xl font-bold">{stats.totalPosts}</h3>
          </Card>
          <Card className="p-5 border-t-4 border-t-blue-500">
            <Users className="w-6 h-6 text-blue-500 mb-2" />
            <p className="text-sm text-muted-foreground mb-1">انضموا هذا الشهر</p>
            <h3 className="text-3xl font-bold">{stats.newUsersThisMonth}</h3>
          </Card>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث عن مستخدم..."
              className="bg-card shadow-sm border-border pr-10"
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
            />
          </div>
          <div className="space-y-3">
            {filteredUsers.map((u) => (
              <Card key={u.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-bold flex items-center gap-2">
                      {u.name}
                      {u.role === 'superadmin' && (
                        <Badge variant="gold" className="text-[10px] px-1.5 py-0">سوبر أدمن</Badge>
                      )}
                      {u.role === 'admin' && (
                        <Badge variant="gold" className="text-[10px] px-1.5 py-0">مشرف</Badge>
                      )}
                    </h4>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5" dir="ltr">{u.email}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-destructive'}`} />
                </div>

                <div className="flex gap-2">
                  {u.role !== 'superadmin' && u.id !== user?.id && (
                    <>
                      <Button
                        size="sm"
                        variant={u.isActive ? 'outline' : 'default'}
                        className={`flex-1 text-xs ${u.isActive ? 'text-destructive border-destructive hover:bg-destructive/10' : ''}`}
                        onClick={() => toggleActiveMutation.mutate({ userId: u.id })}
                        isLoading={toggleActiveMutation.isPending}
                      >
                        {u.isActive ? 'إيقاف' : 'تفعيل'}
                      </Button>

                      {isSuperAdmin && (
                        <Button
                          size="sm"
                          variant="outline"
                          className={`flex-1 text-xs ${u.role === 'admin' ? 'text-orange-500 border-orange-300' : 'text-primary border-primary/30'}`}
                          onClick={() => makeAdminMutation.mutate({ userId: u.id })}
                          isLoading={makeAdminMutation.isPending}
                        >
                          {u.role === 'admin' ? (
                            <><ShieldOff className="w-3 h-3 ml-1" />إزالة الإشراف</>
                          ) : (
                            <><Shield className="w-3 h-3 ml-1" />تعيين مشرفاً</>
                          )}
                        </Button>
                      )}
                    </>
                  )}
                  {u.id === user?.id && (
                    <span className="text-xs text-muted-foreground italic">حسابك الحالي</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'posts' && (
        <div className="space-y-4">
          <Button className="w-full" onClick={() => setShowCreatePost(true)}>
            <Plus className="w-5 h-5 ml-2" />
            إضافة منشور جديد
          </Button>

          {loadingPosts ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Pending Posts */}
              {allPosts.filter(p => !p.isPublished).length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <h3 className="font-bold text-amber-600 dark:text-amber-400 text-sm">
                      بانتظار المراجعة ({allPosts.filter(p => !p.isPublished).length})
                    </h3>
                  </div>
                  {allPosts.filter(p => !p.isPublished).map(p => (
                    <Card key={p.id} className="p-4 border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold flex-1 ml-2 leading-snug text-sm">{p.title}</h4>
                        <Badge variant="outline" className="text-amber-600 border-amber-400 text-xs">بانتظار المراجعة</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">بواسطة {p.authorName}</p>
                      <p className="text-xs text-muted-foreground mb-3">{format(new Date(p.createdAt), 'yyyy-MM-dd')}</p>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{p.content}</p>
                      {p.imageUrl && (
                        <img src={p.imageUrl} alt="post" className="w-full max-h-32 object-cover rounded-lg mb-3" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => approvePost(p.id, true)}
                          isLoading={approvingId === p.id}
                        >
                          ✓ قبول ونشر
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-destructive border-destructive hover:bg-destructive/10"
                          onClick={() => deletePostDirect(p.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5 ml-1" />
                          رفض وحذف
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Published Posts */}
              <div className="space-y-3">
                {allPosts.filter(p => !p.isPublished).length > 0 && (
                  <h3 className="font-bold text-sm text-muted-foreground">المنشورات المنشورة ({allPosts.filter(p => p.isPublished).length})</h3>
                )}
                {allPosts.filter(p => p.isPublished).map(p => (
                  <Card key={p.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold flex-1 ml-2 leading-snug text-sm">{p.title}</h4>
                      <Badge variant="default" className="text-xs">منشور</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">بواسطة {p.authorName}</p>
                    <p className="text-xs text-muted-foreground mb-3">{format(new Date(p.createdAt), 'yyyy-MM-dd')}</p>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{p.content}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-destructive border-destructive hover:bg-destructive/10"
                      onClick={() => deletePostDirect(p.id)}
                    >
                      <Trash2 className="w-4 h-4 ml-2" />
                      حذف المنشور
                    </Button>
                  </Card>
                ))}
                {allPosts.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground text-sm">لا توجد منشورات بعد</p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'support' && <SupportTicketsPanel />}
    </div>
  );
}
