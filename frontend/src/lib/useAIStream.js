import { useState, useCallback } from 'react';

export function useAIStream() {
    const [streamingContent, setStreamingContent] = useState('');
    const [thoughts, setThoughts] = useState('');
    const [finalResponse, setFinalResponse] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState(null);

    const resetStream = () => {
        setStreamingContent('');
        setThoughts('');
        setFinalResponse('');
        setIsThinking(false);
        setIsStreaming(false);
        setError(null);
    };

    const processStream = useCallback(async (url, body) => {
        resetStream();
        setIsStreaming(true);
        setIsThinking(true); // Assume thinking starts immediately or soon

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ...body, stream: true }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                accumulatedText += chunk;
                // setStreamingContent(prev => prev + chunk);

                // Parse <think> tags
                // We want to separate content inside <think>...</think> from the rest
                const thinkOpenIndex = accumulatedText.indexOf('<think>');
                const thinkCloseIndex = accumulatedText.indexOf('</think>');

                if (thinkOpenIndex !== -1 && thinkCloseIndex !== -1) {
                    // Thinking complete
                    const thoughtsContent = accumulatedText.substring(thinkOpenIndex + 7, thinkCloseIndex);
                    const finalContent = accumulatedText.substring(thinkCloseIndex + 8);

                    setThoughts(thoughtsContent);
                    setFinalResponse(finalContent);
                    setIsThinking(false);
                } else if (thinkOpenIndex !== -1) {
                    // Still thinking (open tag found, no close tag)
                    const thoughtsContent = accumulatedText.substring(thinkOpenIndex + 7);
                    setThoughts(thoughtsContent);
                    setFinalResponse('');
                    setIsThinking(true);
                } else {
                    // No think tag found yet
                    // If the text is getting long and no <think>, assume it's just response
                    if (accumulatedText.length > 50) {
                        setIsThinking(false);
                        setFinalResponse(accumulatedText);
                    } else {
                        // Buffer small initial content
                    }
                }
            }
        } catch (err) {
            console.error("Streaming failed:", err);
            setError(err.message || "Failed to stream analysis.");
        } finally {
            setIsStreaming(false);
            setIsThinking(false);
        }
    }, []);

    return {
        processStream,
        streamingContent,
        thoughts,
        finalResponse,
        isThinking,
        isStreaming,
        error,
        resetStream
    };
}
