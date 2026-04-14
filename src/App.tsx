import { useState, useEffect } from 'react';
import { Type } from '@google/genai';
import { ChevronLeft, Loader2, Plus, Settings, Sparkles, FolderOpen } from 'lucide-react';

type Screen = 'setup' | 'home' | 'workspace' | 'detail' | 'plan' | 'schedule';

interface Context {
  niche: string;
  platform: string;
}

interface Idea {
  idea: string;
  script?: string[];
  caption?: string;
  tags?: string[];
  score?: number;
  action?: string;
}

interface TodayPlan {
  idea: string;
  type: 'reel' | 'post' | 'carousel';
  hook: string;
}

interface WeeklyPlan {
  plan: string[];
}

interface Schedule {
  slots: string[];
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('setup');
  const [context, setContext] = useState<Context | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [todayPlan, setTodayPlan] = useState<TodayPlan | null>(null);
  const [trends, setTrends] = useState<string[]>([]);
  
  const [nicheInput, setNicheInput] = useState('');
  const [platformInput, setPlatformInput] = useState('instagram');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);
  const [isGeneratingTodayPlan, setIsGeneratingTodayPlan] = useState(false);
  const [isGeneratingFullContent, setIsGeneratingFullContent] = useState(false);
  const [fullContentResult, setFullContentResult] = useState<Idea | null>(null);
  const [generatingStep, setGeneratingStep] = useState<string | null>(null);
  const [isGettingTrends, setIsGettingTrends] = useState(false);
  const [isScoringIdea, setIsScoringIdea] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from local storage on mount
  useEffect(() => {
    const savedContext = localStorage.getItem('scorpio_context');
    const savedIdeas = localStorage.getItem('scorpio_ideas');
    const savedPlan = localStorage.getItem('scorpio_plan');
    const savedSchedule = localStorage.getItem('scorpio_schedule');
    const savedTrends = localStorage.getItem('scorpio_trends');
    const savedTodayPlan = localStorage.getItem('scorpio_today_plan');
    
    if (savedContext) {
      try {
        const parsed = JSON.parse(savedContext);
        setContext(parsed);
        setNicheInput(parsed.niche);
        setPlatformInput(parsed.platform);
        setScreen('home');
      } catch (e) {
        console.error('Failed to parse context', e);
      }
    }
    
    if (savedIdeas) {
      try {
        const parsed = JSON.parse(savedIdeas);
        // Migration: if it's string[], convert to Idea[]
        if (Array.isArray(parsed)) {
           setIdeas(parsed.map((item: any) => {
             if (typeof item === 'string') return { idea: item };
             if (item.text) {
               const { text, ...rest } = item;
               return { idea: text, ...rest };
             }
             return item;
           }));
        } else {
           setIdeas(parsed);
        }
      } catch (e) {
        console.error('Failed to parse ideas', e);
      }
    }

    if (savedPlan) {
      try {
        setWeeklyPlan(JSON.parse(savedPlan));
      } catch (e) {
        console.error('Failed to parse plan', e);
      }
    }

    if (savedSchedule) {
      try {
        setSchedule(JSON.parse(savedSchedule));
      } catch (e) {
        console.error('Failed to parse schedule', e);
      }
    }

    if (savedTrends) {
      try {
        setTrends(JSON.parse(savedTrends));
      } catch (e) {
        console.error('Failed to parse trends', e);
      }
    }

    if (savedTodayPlan) {
      try {
        setTodayPlan(JSON.parse(savedTodayPlan));
      } catch (e) {
        console.error('Failed to parse today plan', e);
      }
    }
  }, []);

  const generateContent = async (goal: string, params: any) => {
    switch (goal) {
      case 'script': return await generateScriptWithRetry(params.idea, params.platform);
      case 'caption': return await generateCaptionWithRetry(params.idea, params.platform);
      case 'trends': return await generateTrendsWithRetry(params.niche);
      case 'score': return await generateScoreWithRetry(params.idea);
      case 'todayPlan': return await generateTodayPlanWithRetry(params.ctx);
      case 'plan': return await generatePlanWithRetry(params.ctx);
      case 'schedule': return await generateScheduleWithRetry(params.plan, params.tz);
      case 'ideas': return await generateIdeasWithRetry(params.ctx);
      default: throw new Error("Unknown goal");
    }
  };

  const handleSaveContext = () => {
    if (!nicheInput.trim()) {
      setError('Please enter a niche');
      return;
    }
    const newContext = { niche: nicheInput.trim(), platform: platformInput };
    setContext(newContext);
    localStorage.setItem('scorpio_context', JSON.stringify(newContext));
    setError(null);
    setScreen('home');
  };

  const handleGenerateIdeas = async () => {
    if (!context) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const newIdeasStrings = await generateContent('ideas', { ctx: context }) as string[];
      const newIdeas: Idea[] = newIdeasStrings.map((idea: string) => ({ idea }));
      const updatedIdeas = [...newIdeas, ...ideas];
      setIdeas(updatedIdeas);
      localStorage.setItem('scorpio_ideas', JSON.stringify(updatedIdeas));
      setScreen('workspace');
    } catch (err) {
      console.error(err);
      setError('Failed to generate ideas. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateScript = async () => {
    if (!selectedIdea || !context) return;
    
    setIsGeneratingScript(true);
    setError(null);
    
    try {
      const script = await generateContent('script', { idea: selectedIdea.idea, platform: context.platform });
      
      const updatedIdea = { ...selectedIdea, script };
      const updatedIdeas = ideas.map(i => i === selectedIdea ? updatedIdea : i);
      
      setIdeas(updatedIdeas);
      setSelectedIdea(updatedIdea);
      localStorage.setItem('scorpio_ideas', JSON.stringify(updatedIdeas));
    } catch (err) {
      console.error(err);
      setError('Failed to generate script. Please try again.');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleGenerateCaption = async () => {
    if (!selectedIdea || !context) return;
    
    setIsGeneratingCaption(true);
    setError(null);
    
    try {
      const { caption, tags } = await generateContent('caption', { idea: selectedIdea.idea, platform: context.platform }) as { caption: string, tags: string[] };
      
      const updatedIdea = { ...selectedIdea, caption, tags };
      const updatedIdeas = ideas.map(i => i === selectedIdea ? updatedIdea : i);
      
      setIdeas(updatedIdeas);
      setSelectedIdea(updatedIdea);
      localStorage.setItem('scorpio_ideas', JSON.stringify(updatedIdeas));
    } catch (err) {
      console.error(err);
      setError('Failed to generate caption. Please try again.');
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  const getFallbackResponse = (prompt: string): string => {
    let p;
    try {
      p = JSON.parse(prompt);
    } catch {
      return JSON.stringify({ error: "Fallback" });
    }
    
    if (p.goal === 'ideas') return JSON.stringify({ ideas: ["Idea 1: How to get started", "Idea 2: 5 tips for success", "Idea 3: My daily routine", "Idea 4: Why I love this", "Idea 5: Common mistakes"] });
    if (p.duration) return JSON.stringify({ script: ["Hook: Did you know this?", "Point 1: First, do this.", "Point 2: Then, do that.", "CTA: Follow for more!"] });
    if (p.tone) return JSON.stringify({ caption: "This is a great tip!", tags: ["#tips", "#success", "#daily", "#learning", "#growth"] });
    if (p.goal === 'trends') return JSON.stringify({ trends: ["Trend 1", "Trend 2", "Trend 3", "Trend 4", "Trend 5"] });
    if (p.hist && p.trend) return JSON.stringify({ score: 0.5, action: "post" });
    if (p.goal === 'today') return JSON.stringify({ idea: "Share a quick tip", type: "reel", hook: "Stop scrolling!" });
    if (p.goal === 'weekly') return JSON.stringify({ plan: ["mon-reel", "tue-post", "wed-carousel", "thu-reel", "fri-post", "sat-carousel", "sun-reel"] });
    if (p.plan) return JSON.stringify({ slots: ["mon-10", "tue-18", "wed-12", "thu-15", "fri-09", "sat-11", "sun-14"] });
    
    // Default fallback
    return JSON.stringify({
      idea: "Short viral content idea",
      script: ["Hook: Did you know?", "Point 1: First step.", "Point 2: Second step.", "CTA: Follow for more!"],
      caption: "Short engaging caption",
      tags: ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]
    });
  };

  const callGeminiApi = async (prompt: string, config: any) => {
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, config })
      });
      if (!response.ok) throw new Error('Failed to call Gemini API');
      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error("Gemini API call failed, using fallback:", error);
      return getFallbackResponse(prompt);
    }
  };

  const generateScriptWithRetry = async (idea: string, platform: string, retry = false): Promise<string[]> => {
    const prompt = JSON.stringify({
      idea,
      platform,
      duration: 30
    });

    try {
      const text = await callGeminiApi(prompt, {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            script: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["script"]
        }
      });

      const parsed = JSON.parse(text || "{}");
      if (!parsed.script || !Array.isArray(parsed.script)) throw new Error("Invalid script format");
      return parsed.script;
    } catch (err) {
      if (!retry) return generateScriptWithRetry(idea, platform, true);
      throw err;
    }
  };

  const generateCaptionWithRetry = async (idea: string, platform: string, retry = false): Promise<{caption: string, tags: string[]}> => {
    const prompt = JSON.stringify({
      idea,
      platform,
      tone: 1
    });

    try {
      const text = await callGeminiApi(prompt, {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            caption: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["caption", "tags"]
        }
      });

      const parsed = JSON.parse(text || "{}");
      if (!parsed.caption || !Array.isArray(parsed.tags)) throw new Error("Invalid caption format");
      return { caption: parsed.caption, tags: parsed.tags };
    } catch (err) {
      if (!retry) return generateCaptionWithRetry(idea, platform, true);
      throw err;
    }
  };

  const handleGetTrends = async () => {
    if (!context) return;
    setIsGettingTrends(true);
    setError(null);
    try {
      const trends = await generateTrendsWithRetry(context.niche);
      setTrends(trends);
      localStorage.setItem('scorpio_trends', JSON.stringify(trends));
    } catch (err) {
      console.error(err);
      setError('Failed to get trends.');
    } finally {
      setIsGettingTrends(false);
    }
  };

  const handleScoreIdea = async () => {
    if (!selectedIdea) return;
    setIsScoringIdea(true);
    setError(null);
    try {
      const { score, action } = await generateScoreWithRetry(selectedIdea.idea);
      const updatedIdea = { ...selectedIdea, score, action };
      const updatedIdeas = ideas.map(i => i === selectedIdea ? updatedIdea : i);
      setIdeas(updatedIdeas);
      setSelectedIdea(updatedIdea);
      localStorage.setItem('scorpio_ideas', JSON.stringify(updatedIdeas));
    } catch (err) {
      console.error(err);
      setError('Failed to score idea.');
    } finally {
      setIsScoringIdea(false);
    }
  };

  const handleGenerateTodayPlan = async () => {
    if (!context) return;
    setIsGeneratingTodayPlan(true);
    setError(null);
    try {
      const plan = await generateTodayPlanWithRetry(context);
      setTodayPlan(plan);
      localStorage.setItem('scorpio_today_plan', JSON.stringify(plan));
    } catch (err) {
      console.error(err);
      setError('Failed to generate today plan.');
    } finally {
      setIsGeneratingTodayPlan(false);
    }
  };

  const handleCreateFullContent = async () => {
    if (!context) return;
    setIsGeneratingFullContent(true);
    setFullContentResult(null);
    setError(null);

    try {
      setGeneratingStep("Generating idea...");
      const ideas = await generateIdeasWithRetry(context);
      const idea = ideas[0];
      
      setGeneratingStep("Writing script...");
      const script = await generateScriptWithRetry(idea, context.platform);
      
      setGeneratingStep("Creating caption...");
      const { caption, tags } = await generateCaptionWithRetry(idea, context.platform);
      
      const result: Idea = { idea, script, caption, tags };
      setFullContentResult(result);
    } catch (err) {
      console.error(err);
      setError('Pipeline failed. Please try again.');
    } finally {
      setIsGeneratingFullContent(false);
      setGeneratingStep(null);
    }
  };

  const handleSaveFullContent = () => {
    if (!fullContentResult) return;
    const updatedIdeas = [fullContentResult, ...ideas];
    setIdeas(updatedIdeas);
    localStorage.setItem('scorpio_ideas', JSON.stringify(updatedIdeas));
    setFullContentResult(null);
    setScreen('workspace');
  };

  const handleSaveTodayPlanToWorkspace = () => {
    if (!todayPlan) return;
    const newIdea: Idea = { idea: todayPlan.idea };
    const updatedIdeas = [newIdea, ...ideas];
    setIdeas(updatedIdeas);
    localStorage.setItem('scorpio_ideas', JSON.stringify(updatedIdeas));
    setTodayPlan(null);
    localStorage.removeItem('scorpio_today_plan');
    setScreen('workspace');
  };

  const generateTodayPlanWithRetry = async (ctx: Context, retry = false): Promise<TodayPlan> => {
    const prompt = JSON.stringify({
      ctx: { n: ctx.niche, p: [ctx.platform] },
      hist: [],
      goal: "today"
    });
    try {
      const text = await callGeminiApi(prompt, {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            idea: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["reel", "post", "carousel"] },
            hook: { type: Type.STRING }
          },
          required: ["idea", "type", "hook"]
        }
      });
      const parsed = JSON.parse(text || "{}");
      if (!parsed.idea || !parsed.type || !parsed.hook) throw new Error("Invalid today plan format");
      return parsed;
    } catch (err) {
      if (!retry) return generateTodayPlanWithRetry(ctx, true);
      throw err;
    }
  };

  const generateTrendsWithRetry = async (niche: string, retry = false): Promise<string[]> => {
    const prompt = JSON.stringify({ ctx: { n: niche }, goal: "trends", count: 5 });
    try {
      const text = await callGeminiApi(prompt, {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            trends: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["trends"]
        }
      });
      const parsed = JSON.parse(text || "{}");
      if (!parsed.trends || !Array.isArray(parsed.trends)) throw new Error("Invalid trends format");
      return parsed.trends;
    } catch (err) {
      if (!retry) return generateTrendsWithRetry(niche, true);
      throw err;
    }
  };

  const generateScoreWithRetry = async (idea: string, retry = false): Promise<{score: number, action: string}> => {
    const prompt = JSON.stringify({ idea, hist: [], trend: 1 });
    try {
      const text = await callGeminiApi(prompt, {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            action: { type: Type.STRING, enum: ["post", "revise", "drop"] }
          },
          required: ["score", "action"]
        }
      });
      const parsed = JSON.parse(text || "{}");
      if (typeof parsed.score !== 'number' || !parsed.action) throw new Error("Invalid score format");
      return { score: parsed.score, action: parsed.action };
    } catch (err) {
      if (!retry) return generateScoreWithRetry(idea, true);
      throw err;
    }
  };

  const handlePlanWeek = async () => {
    if (!context) return;
    setIsGeneratingPlan(true);
    setError(null);
    try {
      const plan = await generatePlanWithRetry(context);
      setWeeklyPlan({ plan });
      localStorage.setItem('scorpio_plan', JSON.stringify({ plan }));
      setScreen('plan');
    } catch (err) {
      console.error(err);
      setError('Failed to generate plan.');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleGenerateSchedule = async () => {
    if (!weeklyPlan) return;
    setIsGeneratingSchedule(true);
    setError(null);
    try {
      const schedule = await generateScheduleWithRetry(weeklyPlan.plan, 'IST');
      setSchedule({ slots: schedule });
      localStorage.setItem('scorpio_schedule', JSON.stringify({ slots: schedule }));
      setScreen('schedule');
    } catch (err) {
      console.error(err);
      setError('Failed to generate schedule.');
    } finally {
      setIsGeneratingSchedule(false);
    }
  };

  const generatePlanWithRetry = async (ctx: Context, retry = false): Promise<string[]> => {
    const prompt = JSON.stringify({
      ctx: { n: ctx.niche, p: [ctx.platform] },
      hist: [],
      goal: "weekly",
      days: 7
    });
    try {
      const text = await callGeminiApi(prompt, {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            plan: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["plan"]
        }
      });
      const parsed = JSON.parse(text || "{}");
      if (!parsed.plan || !Array.isArray(parsed.plan)) throw new Error("Invalid plan format");
      return parsed.plan;
    } catch (err) {
      if (!retry) return generatePlanWithRetry(ctx, true);
      throw err;
    }
  };

  const generateScheduleWithRetry = async (plan: string[], tz: string, retry = false): Promise<string[]> => {
    const prompt = JSON.stringify({ plan, tz });
    try {
      const text = await callGeminiApi(prompt, {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            slots: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["slots"]
        }
      });
      const parsed = JSON.parse(text || "{}");
      if (!parsed.slots || !Array.isArray(parsed.slots)) throw new Error("Invalid schedule format");
      return parsed.slots;
    } catch (err) {
      if (!retry) return generateScheduleWithRetry(plan, tz, true);
      throw err;
    }
  };

  const generateIdeasWithRetry = async (ctx: Context, retry = false): Promise<string[]> => {
    const prompt = JSON.stringify({
      ctx: { n: ctx.niche, p: [ctx.platform] },
      goal: "ideas",
      count: 5
    });

    try {
      const text = await callGeminiApi(prompt, {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ideas: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING
              }
            }
          },
          required: ["ideas"]
        }
      });
      
      const parsed = JSON.parse(text || "{}");
      if (!parsed.ideas || !Array.isArray(parsed.ideas)) {
        throw new Error("Invalid JSON structure");
      }
      
      return parsed.ideas;
    } catch (err) {
      if (!retry) {
        console.log("Retrying generation due to error:", err);
        return generateIdeasWithRetry(ctx, true);
      }
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans flex justify-center">
      <div className="w-full max-w-md bg-white shadow-sm min-h-screen flex flex-col relative">
        
        {/* Header */}
        <header className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {screen !== 'home' && screen !== 'setup' && (
              <button 
                onClick={() => setScreen('home')}
                className="p-2 -ml-2 text-zinc-400 hover:text-zinc-900 transition-colors rounded-full hover:bg-zinc-50"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <h1 className="text-lg font-semibold tracking-tight">SCORPIO</h1>
          </div>
          {screen === 'home' && (
            <button 
              onClick={() => setScreen('setup')}
              className="p-2 -mr-2 text-zinc-400 hover:text-zinc-900 transition-colors rounded-full hover:bg-zinc-50"
            >
              <Settings size={20} />
            </button>
          )}
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
              {error}
            </div>
          )}

          {screen === 'setup' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight">Setup Context</h2>
                <p className="text-zinc-500 text-sm">Define your niche and platform to get started.</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Niche</label>
                  <input
                    type="text"
                    value={nicheInput}
                    onChange={(e) => setNicheInput(e.target.value)}
                    placeholder="e.g. Minimalist Tech Reviews"
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all outline-none"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Platform</label>
                  <select
                    value={platformInput}
                    onChange={(e) => setPlatformInput(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all outline-none appearance-none"
                  >
                    <option value="instagram">Instagram</option>
                    <option value="youtube">YouTube</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleSaveContext}
                className="w-full py-3.5 px-4 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 active:scale-[0.98] transition-all"
              >
                Save Context
              </button>
            </div>
          )}

          {screen === 'home' && (
            <div className="flex flex-col h-full justify-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">What should I post today?</h2>
                {todayPlan ? (
                  <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-4">
                    <div className="space-y-1">
                      <p className="text-sm text-zinc-500 font-medium">Idea</p>
                      <p className="text-zinc-900">{todayPlan.idea}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-zinc-500 font-medium">Type</p>
                        <p className="text-zinc-900 capitalize">{todayPlan.type}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-zinc-500 font-medium">Hook</p>
                        <p className="text-zinc-900">{todayPlan.hook}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          const idea: Idea = { idea: todayPlan.idea };
                          setSelectedIdea(idea);
                          setScreen('detail');
                        }}
                        className="text-xs py-2 px-3 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
                      >
                        Script
                      </button>
                      <button
                        onClick={() => {
                          const idea: Idea = { idea: todayPlan.idea };
                          setSelectedIdea(idea);
                          setScreen('detail');
                        }}
                        className="text-xs py-2 px-3 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
                      >
                        Caption
                      </button>
                    </div>
                    <button
                      onClick={handleSaveTodayPlanToWorkspace}
                      className="w-full text-xs py-2 px-3 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
                    >
                      Save to Workspace
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleGenerateTodayPlan}
                    disabled={isGeneratingTodayPlan}
                    className="w-full py-4 px-6 bg-zinc-100 rounded-2xl font-medium hover:bg-zinc-200 transition-all"
                  >
                    {isGeneratingTodayPlan ? 'Generating...' : 'Get Today Plan'}
                  </button>
                )}
              </div>

              <button
                onClick={handleGenerateIdeas}
                disabled={isGenerating}
                className="w-full group relative overflow-hidden rounded-2xl bg-zinc-900 text-white p-8 flex flex-col items-center justify-center gap-4 hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-80 disabled:active:scale-100"
              >
                {isGenerating ? (
                  <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
                ) : (
                  <Sparkles className="w-8 h-8 text-zinc-300 group-hover:text-white transition-colors" />
                )}
                <span className="font-medium text-lg">
                  {isGenerating ? 'Generating...' : 'Generate Ideas'}
                </span>
              </button>

              <button
                onClick={handleCreateFullContent}
                disabled={isGeneratingFullContent}
                className="w-full rounded-2xl bg-zinc-900 text-white p-6 flex flex-col items-center justify-center gap-3 hover:bg-zinc-800 active:scale-[0.98] transition-all"
              >
                {isGeneratingFullContent ? (
                  <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                ) : (
                  <Sparkles className="w-6 h-6 text-zinc-300" />
                )}
                <span className="font-medium">
                  {isGeneratingFullContent ? generatingStep : 'Create Full Content'}
                </span>
              </button>

              {fullContentResult && (
                <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-4 animate-in fade-in zoom-in-95 duration-500">
                  <h3 className="font-semibold text-zinc-900">Result</h3>
                  <p className="text-zinc-900">{fullContentResult.idea}</p>
                  <div className="space-y-1">
                    {fullContentResult.script?.map((line, i) => (
                      <p key={i} className="text-sm text-zinc-600">{line}</p>
                    ))}
                  </div>
                  <p className="text-sm text-zinc-600">{fullContentResult.caption}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleSaveFullContent} className="text-xs py-2 px-3 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors">Save</button>
                    <button onClick={handleCreateFullContent} className="text-xs py-2 px-3 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors">Regenerate</button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleGetTrends}
                  disabled={isGettingTrends}
                  className="rounded-2xl bg-zinc-100 text-zinc-900 p-6 flex flex-col items-center justify-center gap-3 hover:bg-zinc-200 active:scale-[0.98] transition-all"
                >
                  <Sparkles className="w-6 h-6 text-zinc-500" />
                  <span className="font-medium text-sm">Get Trends</span>
                </button>
                <button
                  onClick={handlePlanWeek}
                  disabled={isGeneratingPlan}
                  className="rounded-2xl bg-zinc-900 text-white p-6 flex flex-col items-center justify-center gap-3 hover:bg-zinc-800 active:scale-[0.98] transition-all"
                >
                  <Sparkles className="w-6 h-6 text-zinc-300" />
                  <span className="font-medium text-sm">Plan My Week</span>
                </button>
              </div>

              {trends.length > 0 && (
                <div className="bg-zinc-100 rounded-2xl p-6 space-y-3">
                  <h3 className="font-semibold text-zinc-900">Trending Now</h3>
                  <ul className="space-y-2">
                    {trends.map((trend, i) => (
                      <li key={i} className="text-sm text-zinc-600 bg-white p-2 rounded-lg">{trend}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={() => setScreen('workspace')}
                className="w-full rounded-2xl bg-zinc-100 text-zinc-900 p-6 flex flex-col items-center justify-center gap-3 hover:bg-zinc-200 active:scale-[0.98] transition-all"
              >
                <FolderOpen className="w-6 h-6 text-zinc-500" />
                <span className="font-medium">View Workspace</span>
              </button>
            </div>
          )}

          {screen === 'plan' && weeklyPlan && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-semibold tracking-tight">Weekly Plan</h2>
              <div className="space-y-3">
                {weeklyPlan.plan.map((item, i) => {
                  const [day, type] = item.split('-');
                  return (
                    <div key={i} className="p-4 rounded-xl bg-white border border-zinc-100 shadow-sm flex justify-between">
                      <span className="font-medium capitalize">{day}</span>
                      <span className="text-zinc-500 capitalize">{type}</span>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={handleGenerateSchedule}
                disabled={isGeneratingSchedule}
                className="w-full py-3.5 px-4 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 active:scale-[0.98] transition-all"
              >
                {isGeneratingSchedule ? 'Generating...' : 'Generate Time Slots'}
              </button>
            </div>
          )}

          {screen === 'schedule' && schedule && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-semibold tracking-tight">Schedule</h2>
              <div className="space-y-3">
                {schedule.slots.map((slot, i) => {
                  const [day, time] = slot.split('-');
                  const type = weeklyPlan?.plan[i]?.split('-')[1] || 'Content';
                  return (
                    <div key={i} className="p-4 rounded-xl bg-white border border-zinc-100 shadow-sm flex justify-between">
                      <span className="font-medium capitalize">{day} — {type}</span>
                      <span className="text-zinc-500">{time}:00</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {screen === 'workspace' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold tracking-tight">Workspace</h2>
                <span className="text-sm font-medium text-zinc-400 bg-zinc-100 px-3 py-1 rounded-full">
                  {ideas.length} saved
                </span>
              </div>

              {ideas.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FolderOpen className="w-8 h-8 text-zinc-300" />
                  </div>
                  <p className="text-zinc-500">No ideas saved yet.</p>
                  <button 
                    onClick={() => setScreen('home')}
                    className="mt-4 text-sm font-medium text-zinc-900 hover:underline"
                  >
                    Generate some ideas
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {ideas.map((idea, index) => (
                    <button 
                      key={index}
                      onClick={() => {
                        setSelectedIdea(idea);
                        setScreen('detail');
                      }}
                      className="w-full text-left p-4 rounded-xl bg-white border border-zinc-100 shadow-sm hover:shadow-md transition-shadow text-zinc-800 leading-relaxed"
                    >
                      {idea.idea}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {screen === 'detail' && selectedIdea && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight text-zinc-900">Idea</h2>
                <p className="text-zinc-700 p-4 bg-zinc-50 rounded-xl border border-zinc-100">{selectedIdea.idea}</p>
              </div>

              <button
                onClick={handleGenerateScript}
                disabled={isGeneratingScript}
                className="w-full py-3.5 px-4 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-80 disabled:active:scale-100 flex items-center justify-center gap-2"
              >
                {isGeneratingScript ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {isGeneratingScript ? 'Generating Script...' : 'Generate Script'}
              </button>

              {selectedIdea.script && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-zinc-900">Script</h3>
                  <div className="space-y-2">
                    {selectedIdea.script.map((line, i) => (
                      <p key={i} className="p-3 bg-zinc-50 rounded-lg text-sm text-zinc-700 border border-zinc-100">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleGenerateCaption}
                disabled={isGeneratingCaption}
                className="w-full py-3.5 px-4 bg-zinc-100 text-zinc-900 rounded-xl font-medium hover:bg-zinc-200 active:scale-[0.98] transition-all disabled:opacity-80 disabled:active:scale-100 flex items-center justify-center gap-2"
              >
                {isGeneratingCaption ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {isGeneratingCaption ? 'Generating Caption...' : 'Generate Caption'}
              </button>

              <button
                onClick={handleScoreIdea}
                disabled={isScoringIdea}
                className="w-full py-3.5 px-4 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-80 disabled:active:scale-100 flex items-center justify-center gap-2"
              >
                {isScoringIdea ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {isScoringIdea ? 'Scoring...' : 'Score This Idea'}
              </button>

              {selectedIdea.score !== undefined && (
                <div className="p-4 bg-zinc-900 text-white rounded-xl flex justify-between items-center">
                  <div>
                    <div className="text-xs text-zinc-400 uppercase tracking-wider">Score</div>
                    <div className="text-2xl font-bold">{(selectedIdea.score * 100).toFixed(0)}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-zinc-400 uppercase tracking-wider">Action</div>
                    <div className="text-lg font-bold uppercase">{selectedIdea.action}</div>
                  </div>
                </div>
              )}

              {selectedIdea.caption && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-zinc-900">Caption</h3>
                  <p className="p-3 bg-zinc-50 rounded-lg text-sm text-zinc-700 border border-zinc-100">
                    {selectedIdea.caption}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedIdea.tags?.map((tag, i) => (
                      <span key={i} className="text-xs font-medium text-zinc-500 bg-zinc-100 px-2 py-1 rounded-md">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
