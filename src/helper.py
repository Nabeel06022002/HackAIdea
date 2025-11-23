from langchain.document_loaders import PyPDFLoader, DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from typing import List
from langchain.schema import Document
from langchain.embeddings import HuggingFaceEmbeddings


#Extract text from PDF files
def load_pdf_files(data):
    loader = DirectoryLoader(
        data,
        glob="*.pdf",
        loader_cls = PyPDFLoader
    )
    documents = loader.load()

    return documents


def filter_to_minimal_docs(docs: List[Document]) -> List[Document]:
    minimal_docs: List[Document] = []
    for doc in docs:
       src = doc.metadata.get("source")
       minimal_docs.append(
           Document(
               page_content=doc.page_content, metadata={"source": src}
            )
        )
    return minimal_docs


# split documents into smaller chunks
def text_split(minimal_docs):
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=100,
    )
    texts_chunk = text_splitter.split_documents(minimal_docs)
    return texts_chunk


def download_embeddings():
    model_name = "sentence-transformers/multi-qa-mpnet-base-dot-v1"

    embeddings = HuggingFaceEmbeddings(
        model_name=model_name
        )
    return embeddings
