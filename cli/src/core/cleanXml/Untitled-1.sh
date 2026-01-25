# llama-server -hf bartowski/nomic-ai_nomic-embed-code-GGUF \
#   --embedding \
#   --ctx-size 4096 \
#   --port 8082 \
#   --threads 12 \
#   --n-gpu-layers 999 \
#   --parallel 4 \


#   curl -s http://127.0.0.1:8082/v1/embeddings \
#   -H "Content-Type: application/json" \
#   -d '{
#     "model": "bartowski/Meta-Llama-3.1-8B-Instruct-GGUF:Q5_K_M",
#     "input": "<|im_start|>system\nYou are a model that outputs embeddings for retrieval.<|im_end|>\n<|im_start|>user\nRepresent this query for searching relevant code:\nfind users by email in postgres<|im_end|>\n<|im_start|>assistant\n"
#   }' | jq '.data[0].embedding | length'


#   llama-cli -hf bartowski/Meta-Llama-3.1-8B-Instruct-GGUF:Q4_K_M -p "Explain quantum computing simply."

# llama-cli -hf "bartowski/nomic-ai_nomic-embed-code-GGUF" -p "Hello, who are you?"
