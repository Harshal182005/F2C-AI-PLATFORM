import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../../services/api";


const FarmerAI = () => {

    const [question, setQuestion] = useState("");

    const [messages, setMessages] = useState([]);

    const [loading, setLoading] = useState(false);


    // ==========================================
    // ASK AI
    // ==========================================

    const askAI = async (customQuestion = null) => {

        const currentQuestion =
            customQuestion || question;

        if (
            !currentQuestion.trim() ||
            loading
        ) {
            return;
        }


        // Add user message

        const userMessage = {
            id: Date.now(),
            type: "user",
            text: currentQuestion
        };


        setMessages((previous) => [
            ...previous,
            userMessage
        ]);


        setQuestion("");

        setLoading(true);


        try {

            const token =
                localStorage.getItem(
                    "farmerToken"
                );


            const response =
                await API.post(
                    "/ai/farmer",
                    {
                        question:
                            currentQuestion
                    },
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );


            if (
                response.data.success
            ) {

                const aiMessage = {

                    id:
                        Date.now() + 1,

                    type: "ai",

                    text:
                        response.data.answer

                };


                setMessages((previous) => [

                    ...previous,

                    aiMessage

                ]);

            }

        } catch (error) {

            console.error(
                "AI ERROR:",
                error
            );


            setMessages((previous) => [

                ...previous,

                {

                    id:
                        Date.now() + 1,

                    type: "ai",

                    text:
                        error.response?.data?.message ||
                        "Sorry, I couldn't process your question right now."

                }

            ]);

        } finally {

            setLoading(false);

        }

    };


    // ==========================================
    // HANDLE ENTER
    // ==========================================

    const handleKeyDown = (event) => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            askAI();

        }

    };


    // ==========================================
    // CLEAR CHAT
    // ==========================================

    const clearChat = () => {

        setMessages([]);

    };


    // ==========================================
    // SUGGESTIONS
    // ==========================================

    const suggestions = [

        {
            icon: "🌾",
            title: "Crop Selection",
            question:
                "Which crops are suitable for Maharashtra farming?"
        },

        {
            icon: "🐛",
            title: "Crop Disease",
            question:
                "How can I identify and prevent common crop diseases?"
        },

        {
            icon: "💧",
            title: "Water Management",
            question:
                "How can I improve water management for my crops?"
        },

        {
            icon: "🌱",
            title: "Soil Health",
            question:
                "How can I improve soil health naturally?"
        }

    ];


    return (

        <div className="min-h-screen bg-[#f6f8f3]">


            {/* ====================================== */}
            {/* HEADER */}
            {/* ====================================== */}

            <header className="sticky top-0 z-30 border-b border-[#e5eadf] bg-white/90 backdrop-blur">

                <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-4 lg:px-8">


                    <div>

                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6c806d]">
                            F2C Farmer Center
                        </p>

                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#172018]">
                            AI Farmer Assistant
                        </h1>

                    </div>


                    <div className="flex items-center gap-3">

                        <Link
                            to="/farmer/dashboard"
                            className="rounded-xl border border-[#dfe6dc] bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                            Dashboard
                        </Link>


                        {messages.length > 0 && (

                            <button
                                onClick={clearChat}
                                className="rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                            >
                                Clear Chat
                            </button>

                        )}

                    </div>

                </div>

            </header>


            {/* ====================================== */}
            {/* MAIN */}
            {/* ====================================== */}

            <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8">


                {/* ====================================== */}
                {/* HERO */}
                {/* ====================================== */}

                {messages.length === 0 && (

                    <section className="mb-8">


                        <div className="overflow-hidden rounded-[32px] bg-gradient-to-br from-[#143d23] via-[#245c36] to-[#438451] p-8 text-white shadow-xl lg:p-12">


                            <div className="max-w-3xl">


                                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold backdrop-blur">

                                    <span className="flex h-2 w-2 rounded-full bg-green-300" />

                                    Powered by Gemini AI

                                </div>


                                <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">

                                    Your intelligent
                                    <br />

                                    farming companion.

                                </h2>


                                <p className="mt-5 max-w-2xl text-sm leading-7 text-green-50/80 lg:text-base">

                                    Ask questions about crops, soil,
                                    irrigation, farming practices and
                                    more. Get practical guidance designed
                                    for Indian farmers.

                                </p>


                            </div>


                        </div>

                    </section>

                )}


                {/* ====================================== */}
                {/* CHAT AREA */}
                {/* ====================================== */}

                <section className="overflow-hidden rounded-[28px] border border-[#e2e8df] bg-white shadow-sm">


                    {/* Chat header */}

                    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">


                        <div className="flex items-center gap-3">


                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100 text-xl">

                                🤖

                            </div>


                            <div>

                                <h3 className="font-bold text-gray-900">

                                    F2C AI Assistant

                                </h3>


                                <div className="mt-0.5 flex items-center gap-1.5">

                                    <span className="h-2 w-2 rounded-full bg-green-500" />

                                    <span className="text-xs text-gray-500">

                                        AI assistant online

                                    </span>

                                </div>

                            </div>

                        </div>


                        <span className="hidden rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 sm:block">

                            Farmer Support

                        </span>

                    </div>


                    {/* Messages */}

                    <div className="min-h-[420px] max-h-[560px] overflow-y-auto p-5 lg:p-8">


                        {messages.length === 0 ? (

                            <div className="flex min-h-[360px] items-center justify-center">


                                <div className="w-full max-w-2xl text-center">


                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-green-50 text-3xl">

                                        🌱

                                    </div>


                                    <h3 className="mt-5 text-xl font-bold text-gray-900">

                                        What would you like to know?

                                    </h3>


                                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">

                                        Ask the AI assistant anything
                                        related to farming and crop
                                        management.

                                    </p>


                                    {/* Suggestions */}

                                    <div className="mt-7 grid gap-3 sm:grid-cols-2">


                                        {suggestions.map(
                                            (suggestion) => (

                                                <button
                                                    key={
                                                        suggestion.title
                                                    }
                                                    onClick={() =>
                                                        askAI(
                                                            suggestion.question
                                                        )
                                                    }
                                                    className="group rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-green-300 hover:bg-green-50"
                                                >

                                                    <div className="flex items-start gap-3">

                                                        <span className="text-xl">
                                                            {
                                                                suggestion.icon
                                                            }
                                                        </span>


                                                        <div>

                                                            <p className="text-sm font-semibold text-gray-900">

                                                                {
                                                                    suggestion.title
                                                                }

                                                            </p>


                                                            <p className="mt-1 text-xs leading-5 text-gray-500">

                                                                {
                                                                    suggestion.question
                                                                }

                                                            </p>

                                                        </div>

                                                    </div>

                                                </button>

                                            )
                                        )}

                                    </div>

                                </div>

                            </div>

                        ) : (

                            <div className="space-y-6">


                                {messages.map(
                                    (message) => (

                                        <div
                                            key={
                                                message.id
                                            }
                                            className={
                                                message.type ===
                                                "user"
                                                    ? "flex justify-end"
                                                    : "flex justify-start"
                                            }
                                        >


                                            {message.type ===
                                            "ai" && (

                                                <div className="mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-100">

                                                    🤖

                                                </div>

                                            )}


                                            <div
                                                className={
                                                    message.type ===
                                                    "user"
                                                        ? "max-w-[85%] rounded-2xl rounded-br-md bg-[#245c36] px-5 py-3.5 text-sm leading-6 text-white"
                                                        : "max-w-[85%] rounded-2xl rounded-bl-md bg-gray-50 px-5 py-4 text-sm leading-7 text-gray-700"
                                                }
                                            >

                                                <div className="whitespace-pre-wrap">

                                                    {
                                                        message.text
                                                    }

                                                </div>

                                            </div>


                                        </div>

                                    )
                                )}


                                {/* Loading */}

                                {loading && (

                                    <div className="flex justify-start">


                                        <div className="mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-100">

                                            🤖

                                        </div>


                                        <div className="rounded-2xl rounded-bl-md bg-gray-50 px-5 py-4">

                                            <div className="flex items-center gap-1.5">

                                                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />

                                                <span
                                                    className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                                                    style={{
                                                        animationDelay:
                                                            "0.15s"
                                                    }}
                                                />

                                                <span
                                                    className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                                                    style={{
                                                        animationDelay:
                                                            "0.3s"
                                                    }}
                                                />

                                            </div>

                                        </div>

                                    </div>

                                )}

                            </div>

                        )}

                    </div>


                    {/* ====================================== */}
                    {/* INPUT */}
                    {/* ====================================== */}

                    <div className="border-t border-gray-100 bg-gray-50/70 p-4 lg:p-5">


                        <div className="flex items-end gap-3 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm focus-within:border-green-400 focus-within:ring-4 focus-within:ring-green-50">


                            <textarea
                                value={question}
                                onChange={(event) =>
                                    setQuestion(
                                        event.target.value
                                    )
                                }
                                onKeyDown={
                                    handleKeyDown
                                }
                                disabled={loading}
                                rows={1}
                                placeholder="Ask your farming question..."
                                className="max-h-32 min-h-[44px] flex-1 resize-none border-0 bg-transparent px-3 py-2.5 text-sm text-gray-800 outline-none placeholder:text-gray-400"
                            />


                            <button
                                onClick={() =>
                                    askAI()
                                }
                                disabled={
                                    loading ||
                                    !question.trim()
                                }
                                className="flex h-11 shrink-0 items-center justify-center rounded-xl bg-[#245c36] px-5 text-sm font-semibold text-white transition hover:bg-[#1c4b2c] disabled:cursor-not-allowed disabled:opacity-40"
                            >

                                {loading
                                    ? "Thinking..."
                                    : "Ask AI"}

                            </button>

                        </div>


                        <p className="mt-2 text-center text-[11px] text-gray-400">

                            Press Enter to ask • Shift + Enter for a new line

                        </p>

                    </div>

                </section>


                {/* ====================================== */}
                {/* DISCLAIMER */}
                {/* ====================================== */}

                <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4">

                    <p className="text-xs leading-5 text-amber-800">

                        <span className="font-bold">
                            Important:
                        </span>{" "}

                        AI-generated guidance is for informational
                        purposes. For serious crop diseases,
                        pesticide decisions or major farming
                        decisions, consult a qualified agricultural
                        expert.

                    </p>

                </div>

            </main>

        </div>

    );

};


export default FarmerAI;