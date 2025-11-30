from flask import Flask, render_template, jsonify, request
from src.helper import download_embeddings
from langchain_pinecone import PineconeVectorStore
from langchain_openai import ChatOpenAI
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv
from src.prompt import *
import os
from langchain_community.chat_models import ChatOllama


app = Flask(__name__)


load_dotenv()

PINECONE_API_KEY=os.environ.get('PINECONE_API_KEY')
# OPENAI_API_KEY=os.environ.get('OPENAI_API_KEY')

os.environ["PINECONE_API_KEY"] = PINECONE_API_KEY
# os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY


embeddings = download_embeddings()

index_name = "hackathon" 
# Embed each chunk and upsert the embeddings into your Pinecone index.
docsearch = PineconeVectorStore.from_existing_index(
    index_name=index_name,
    embedding=embeddings
)



retriever = docsearch.as_retriever(search_type="similarity", search_kwargs={"k":3})

# chatModel = ChatOpenAI(model="gpt-4o")
chatModel = ChatOllama(model="llama2:latest")
prompt = ChatPromptTemplate.from_messages(
    [
        ("system", system_prompt),
        ("human", "{input}"),
    ]
)

question_answer_chain = create_stuff_documents_chain(chatModel, prompt)
rag_chain = create_retrieval_chain(retriever, question_answer_chain)



@app.route("/")
def index():
    return render_template('chat.html')


@app.route("/get", methods=["GET", "POST"])
def chat():
    msg = request.form["msg"]
    print("User Input:", msg)

    response = rag_chain.invoke({"input": msg})

    answer = response["answer"]
    docs = response["context"]   # retrieved documents

    citations = []
    for doc in docs:
        meta = doc.metadata

        citations.append({
            "source": meta.get("source"),
            "page_url": meta.get("page_url"),
            "score": meta.get("score"),  # optional if stored
        })

    return {
        "answer": answer,
        "citations": citations
    }


if __name__ == '__main__':
    app.run(host="0.0.0.0", port= 8080, debug= True)
