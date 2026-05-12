import { motion, AnimatePresence } from "motion/react";
import { 
  Box, 
  ChevronRight, 
  ExternalLink, 
  Globe, 
  Layers, 
  Mail, 
  Menu, 
  MessageSquare, 
  MousePointer2, 
  Plus, 
  Shapes, 
  X,
  Upload,
  User,
  LogOut,
  Camera,
  Eye
} from "lucide-react";
import { useState, useEffect } from "react";
import { auth, db, signInWithGoogle, OperationType, handleFirestoreError } from "./lib/firebase";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";
import ModelViewer from "./components/ModelViewer";

interface Project {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  modelUrl?: string;
  description: string;
  year: string;
  ownerId: string;
  createdAt: any;
}

const SERVICES = [
  {
    title: "Архитектурная визуализация",
    desc: "Фотореалистичные рендеры для жилых и коммерческих проектов.",
    icon: <Shapes className="w-6 h-6" />
  },
  {
    title: "Виртуальный стейджинг",
    desc: "Дизайн освещения и расстановка мебели для интерьерных концептов.",
    icon: <Layers className="w-6 h-6" />
  },
  {
    title: "3D Моделирование продуктов",
    desc: "Высокоточные цифровые копии продуктов для маркетинга.",
    icon: <Box className="w-6 h-6" />
  }
];

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Form State
  const [form, setForm] = useState({
    title: "",
    category: "INTERIOR",
    imageUrl: "",
    modelUrl: "",
    description: "",
    year: "2024"
  });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const fetchedProjects = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Project[];
        setProjects(fetchedProjects);
      },
      (error) => {
        // Only handle if it's not a generic permission error during first load (unauthenticated)
        if (!error.message.includes("permission-denied")) {
           handleFirestoreError(error, OperationType.LIST, "projects");
        }
      }
    );
    return () => unsubscribe();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 700000) {
      alert("Файл слишком крупный (>700KB). Пожалуйста, используйте более оптимизированную версию или внешний URL.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setForm(prev => ({ ...prev, modelUrl: event.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || uploading) return;

    try {
      setUploading(true);
      await addDoc(collection(db, "projects"), {
        ...form,
        ownerId: user.uid,
        createdAt: serverTimestamp()
      });
      setIsAddModalOpen(false);
      setForm({
        title: "",
        category: "INTERIOR",
        imageUrl: "",
        modelUrl: "",
        description: "",
        year: "2024"
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "projects");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen font-sans selection:bg-blue-500/30 bg-surface relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Navigation */}
      <nav 
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled ? "glass py-4" : "py-8"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-cyan-400 rounded-lg group-hover:rotate-12 transition-transform shadow-lg shadow-blue-500/20" />
            <span className="text-xl font-bold tracking-tight uppercase">Vertex<span className="text-blue-400">Viz</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-10 text-sm font-medium text-slate-400">
            <a href="#work" className="hover:text-blue-400 transition-colors">Портфолио</a>
            <a href="#services" className="hover:text-blue-400 transition-colors">Услуги</a>
            {user ? (
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 text-blue-400 border border-blue-600/20 rounded-full hover:bg-blue-600/20 transition-all"
                >
                  <Plus className="w-4 h-4" /> Добавить
                </button>
                <div className="flex items-center gap-2 text-slate-300 border-l border-slate-800 pl-4">
                  <img src={user.photoURL || ""} className="w-6 h-6 rounded-full border border-slate-700" alt="" />
                  <button onClick={() => signOut(auth)} className="hover:text-red-400"><LogOut className="w-4 h-4" /></button>
                </div>
              </div>
            ) : (
              <button 
                onClick={signInWithGoogle}
                className="flex items-center gap-2 px-6 py-2.5 bg-white text-slate-950 rounded-full hover:bg-blue-50 transition-all font-bold"
              >
                <User className="w-4 h-4" /> Войти
              </button>
            )}
          </div>

          <button 
            className="md:hidden p-2 text-slate-400"
            onClick={() => setIsMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            className="fixed inset-0 z-[60] bg-slate-950 p-8 flex flex-col justify-between"
          >
            <div className="flex justify-between items-center">
              <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-cyan-400 rounded-lg" />
              <button onClick={() => setIsMenuOpen(false)}>
                <X className="w-8 h-8 text-slate-400" />
              </button>
            </div>
            <div className="flex flex-col gap-8">
              {["WORK", "SERVICES", "CONTACT"].map((item) => (
                <a 
                  key={item}
                  href={`#${item.toLowerCase()}`} 
                  onClick={() => setIsMenuOpen(false)}
                  className="text-6xl font-extrabold tracking-tighter hover:text-blue-400 transition-colors"
                >
                  {item}
                </a>
              ))}
            </div>
            <div className="flex justify-center">
               {!user && (
                 <button onClick={signInWithGoogle} className="w-full py-5 bg-white text-slate-950 rounded-2xl font-bold">ВОЙТИ ЧЕРЕЗ GOOGLE</button>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center px-6 pt-20">
          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Col: Info */}
            <div className="lg:col-span-5 space-y-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-6"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-widest text-[10px]">Доступен для новых проектов</span>
                </div>
                
                <h1 className="text-6xl md:text-7xl font-extrabold leading-[1.1] tracking-tight">
                  Превращаю <span className="text-gradient">чертежи</span> в реальность
                </h1>
                
                <p className="text-slate-400 text-lg leading-relaxed max-w-md">
                  Профессиональная 3D визуализация экстерьеров и интерьеров. Фотореализм, который продает ваши архитектурные идеи.
                </p>

                <div className="grid grid-cols-2 gap-4 pb-4">
                  <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
                    <div className="text-2xl font-bold text-white">{projects.length > 0 ? projects.length : 250}+</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Выполненных заказов</div>
                  </div>
                  <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
                    <div className="text-2xl font-bold text-white">3 дня</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Средний срок рендера</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <a href="#work" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 group text-center">
                    Смотреть работы <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </a>
                  <button className="flex items-center justify-center w-14 h-14 bg-slate-900 border border-slate-800 rounded-2xl hover:bg-slate-800 transition-colors">
                    <ExternalLink className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Right Col: Visuals */}
            <div className="lg:col-span-7 hidden lg:grid grid-cols-2 grid-rows-2 gap-6 h-[600px]">
              {(projects.length > 0 ? projects.slice(0, 4) : []).map((p, idx) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  onClick={() => setSelectedProject(p)}
                  className="relative group overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent z-10" />
                  <img 
                    src={p.imageUrl} 
                    alt={p.title} 
                    className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
                  />
                  <div className="absolute bottom-0 left-0 p-6 z-20">
                    <div className="text-[10px] text-blue-400 font-bold uppercase mb-1 tracking-widest">{p.category}</div>
                    <div className="text-lg font-bold group-hover:text-blue-200 transition-colors flex items-center gap-2">
                       {p.title} {p.modelUrl && <Box className="w-4 h-4 text-blue-400" />}
                    </div>
                  </div>
                </motion.div>
              ))}
              {projects.length === 0 && (
                <div className="col-span-2 row-span-2 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-[3rem] text-slate-600">
                    <Camera className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-sm uppercase tracking-widest font-bold">Проектов пока нет</p>
                    {user && <button onClick={() => setIsAddModalOpen(true)} className="mt-4 text-blue-400 hover:underline">Добавьте свою первую работу</button>}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Portfolio Grid */}
        <section id="work" className="py-32 px-6 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full mb-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Selected Projects</span>
              </div>
              <h2 className="text-5xl font-extrabold tracking-tight underline decoration-blue-500/30 decoration-4 underline-offset-8 uppercase">Портфолио</h2>
            </div>
            <div className="text-blue-400 flex items-center gap-2 font-bold text-sm group cursor-pointer hover:text-blue-300 transition-colors uppercase tracking-widest">
              Смотреть все <ExternalLink className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {projects.map((project, idx) => (
              <motion.div 
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group relative cursor-pointer"
                onClick={() => setSelectedProject(project)}
              >
                <div className="aspect-[16/10] overflow-hidden rounded-[2rem] bg-slate-900 border border-slate-800 relative card-hover">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-80 z-10" />
                  <img 
                    src={project.imageUrl} 
                    alt={project.title}
                    className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-6 right-6 glass p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 duration-300 z-20">
                    <Eye className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="absolute bottom-8 left-8 z-20">
                    <div className="flex items-center gap-3 mb-2">
                       <span className="text-[10px] font-bold bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 rounded-lg text-blue-400 uppercase tracking-widest">{project.category}</span>
                       <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">{project.year}</span>
                    </div>
                    <h3 className="text-2xl font-extrabold tracking-tight flex items-center gap-3">
                      {project.title}
                      {project.modelUrl && <Box className="w-5 h-5 text-blue-400 animate-pulse" />}
                    </h3>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Services */}
        <section id="services" className="py-32 bg-slate-900/10 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full mb-6">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Our Expertise</span>
                </div>
                <h2 className="text-6xl font-extrabold tracking-tight mb-8 leading-tight">Elevating Reality Through <span className="text-gradient">3D</span>.</h2>
                <p className="text-xl text-slate-400 mb-12 leading-relaxed font-light">
                  Мы создаем не просто картинки, а визуальный опыт, который вызывает эмоции и помогает продавать архитектурные решения.
                </p>
                <div className="space-y-4">
                  {SERVICES.map((s) => (
                    <div key={s.title} className="p-6 bg-slate-900/50 border border-slate-800 rounded-[1.5rem] flex items-start gap-6 group hover:border-blue-500/30 transition-all cursor-default">
                      <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        {s.icon}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold mb-1 tracking-tight">{s.title}</h4>
                        <p className="text-sm text-slate-500">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative p-2 bg-slate-800/10 border border-slate-800 rounded-[3rem]">
                <img 
                  src="https://images.unsplash.com/photo-1544200175-ca6e80a7b325?auto=format&fit=crop&q=80&w=1200" 
                  alt="3D Visualization Process" 
                  className="rounded-[2.5rem] grayscale brightness-75 hover:grayscale-0 transition-all duration-1000"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -bottom-8 -left-8 p-8 glass rounded-[2rem] hidden md:block border-slate-700/50">
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-4">
                      {[1,2,3].map(i => (
                        <div key={i} className="w-12 h-12 rounded-full border-2 border-slate-950 overflow-hidden bg-slate-800 shadow-xl">
                          <img src={`https://i.pravatar.cc/150?u=${i}`} alt="user" />
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="text-sm font-bold tracking-tight">Active Collaboration</div>
                      <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-1">Клиентский портал</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section id="contact" className="py-32 px-6">
          <div className="max-w-4xl mx-auto bg-slate-900/50 border border-slate-800 p-12 md:p-24 text-center rounded-[3rem] relative overflow-hidden group shadow-2xl shadow-blue-500/5 transition-all duration-500 hover:border-blue-500/20">
            <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <motion.div
              whileInView={{ scale: [0.95, 1], opacity: [0, 1] }}
              viewport={{ once: true }}
              className="relative z-10"
            >
              <h2 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-8 uppercase">Готовы начать?</h2>
              <p className="text-slate-400 mb-12 text-lg font-light max-w-2xl mx-auto leading-relaxed">
                Есть проект или только идея? Давайте обсудим, как сделать её реальностью. Мы гарантируем фотореализм и соблюдение сроков.
              </p>
              <div className="flex flex-col md:flex-row justify-center gap-6">
                <a 
                  href="mailto:hello@vertex.studio" 
                  className="px-10 py-5 bg-blue-600 text-white font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-blue-700 hover:-translate-y-1 transition-all shadow-xl shadow-blue-600/20"
                >
                  <Mail className="w-5 h-5" /> НАПИСАТЬ НА EMAIL
                </a>
                <button className="px-10 py-5 glass text-white font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-800 hover:-translate-y-1 transition-all">
                  <MessageSquare className="w-5 h-5 text-blue-400" /> ОБСУДИТЬ В ЧАТЕ
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Project Detail Modal */}
      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setSelectedProject(null)}
               className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" 
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="relative w-full max-w-6xl bg-slate-900 rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl flex flex-col lg:flex-row max-h-[90vh]"
             >
                <div className="w-full lg:w-2/3 bg-slate-950 p-4 min-h-[400px]">
                   {selectedProject.modelUrl ? (
                     <ModelViewer url={selectedProject.modelUrl} />
                   ) : (
                     <img 
                       src={selectedProject.imageUrl} 
                       alt={selectedProject.title} 
                       className="w-full h-full object-cover rounded-2xl" 
                     />
                   )}
                </div>
                <div className="w-full lg:w-1/3 p-12 flex flex-col justify-between overflow-y-auto">
                   <div>
                     <div className="flex items-center gap-2 mb-6">
                        <span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20 uppercase tracking-widest">{selectedProject.category}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{selectedProject.year}</span>
                     </div>
                     <h2 className="text-4xl font-extrabold tracking-tight mb-6 leading-tight">{selectedProject.title}</h2>
                     <p className="text-slate-400 leading-relaxed mb-8">{selectedProject.description}</p>
                   </div>
                   <div className="space-y-4">
                      {selectedProject.modelUrl && (
                        <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 flex items-center gap-3">
                           <Box className="w-5 h-5 text-blue-400" />
                           <span className="text-xs font-bold text-blue-300 uppercase tracking-[0.1em]">Интерактивная 3D Модель</span>
                        </div>
                      )}
                      <button 
                        onClick={() => setSelectedProject(null)}
                        className="w-full py-4 glass text-white font-bold rounded-2xl hover:bg-slate-800"
                      >
                        ЗАКРЫТЬ
                      </button>
                   </div>
                </div>
                <button 
                  onClick={() => setSelectedProject(null)}
                  className="absolute top-6 right-6 p-2 glass rounded-full text-slate-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Project Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsAddModalOpen(false)}
               className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" 
             />
             <motion.div 
               initial={{ opacity: 0, y: 50 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: 50 }}
               className="relative w-full max-w-xl bg-slate-900 rounded-[2.5rem] border border-slate-800 p-12 overflow-hidden shadow-2xl"
             >
                <h3 className="text-3xl font-extrabold mb-8 uppercase tracking-tighter">Новый проект</h3>
                <form onSubmit={handleAddProject} className="space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Название</label>
                        <input 
                          required
                          value={form.title}
                          onChange={e => setForm({...form, title: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Категория</label>
                        <select 
                          value={form.category}
                          onChange={e => setForm({...form, category: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors appearance-none"
                        >
                           <option value="INTERIOR">INTERIOR</option>
                           <option value="EXTERIOR">EXTERIOR</option>
                           <option value="PRODUCT">PRODUCT</option>
                        </select>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Ссылка на изображение</label>
                      <input 
                        required
                        value={form.imageUrl}
                        onChange={e => setForm({...form, imageUrl: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                        placeholder="https://..."
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">3D модель (.glb)</label>
                      <div className="flex flex-col gap-3">
                         <input 
                           type="file"
                           accept=".glb,.gltf"
                           onChange={handleFileChange}
                           className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-600/10 file:text-blue-400 hover:file:bg-blue-600/20 cursor-pointer"
                         />
                         <div className="text-[9px] text-slate-600 italic">Или укажите прямую ссылку:</div>
                         <input 
                           value={form.modelUrl && !form.modelUrl.startsWith('data:') ? form.modelUrl : ''}
                           onChange={e => setForm({...form, modelUrl: e.target.value})}
                           className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 outline-none focus:border-blue-500 transition-colors text-sm"
                           placeholder="https://..."
                         />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Описание</label>
                      <textarea 
                        value={form.description}
                        onChange={e => setForm({...form, description: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors h-24 resize-none"
                      />
                   </div>
                   <button 
                     type="submit"
                     disabled={uploading}
                     className={`w-full py-5 bg-blue-600 text-white font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all group ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                   >
                     {uploading ? "ЗАГРУЗКА..." : "ОПУБЛИКОВАТЬ ПРОЕКТ"} <Upload className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
                   </button>
                </form>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="absolute top-8 right-8 text-slate-500 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-900 px-6 bg-slate-950/50 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">
            &copy; 2024 VERTEX VIZ STUDIO // Available Worldwide
          </div>
          <div className="flex items-center gap-8">
            {["Instagram", "Behance", "Artstation"].map(social => (
              <a key={social} href="#" className="text-[10px] font-bold text-slate-500 hover:text-blue-400 transition-colors tracking-widest uppercase">{social}</a>
            ))}
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">
            <Globe className="w-3 h-3 text-blue-500" /> Based in London // GMT+1
          </div>
        </div>
      </footer>
    </div>
  );
}
