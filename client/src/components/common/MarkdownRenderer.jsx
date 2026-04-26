import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';

const omitNode = (props) => {
  const cleanProps = { ...props };
  delete cleanProps.node;
  return cleanProps;
};

const MarkdownRenderer = ({content}) => {
  return (
    <div className="text-neutral-700">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (props) => <h1 className="text-xl font-bold mt-4 mb-2" {...omitNode(props)} />,
          h2: (props) => <h2 className="text-lg font-bold mt-4 mb-2" {...omitNode(props)} />,
          h3: (props) => <h3 className="text-md font-bold mt-3 mb-2" {...omitNode(props)} />,
          h4: (props) => <h4 className="text-sm font-bold mt-3 mb-1" {...omitNode(props)} />,
          p: (props) => <p className="mb-2 leading-relaxed" {...omitNode(props)} />,
          a: (props) => <a className="text-[#00d492] hover:underline" {...omitNode(props)} />,
          ul: (props) => <ul className="list-disc list-inside mb-2 ml-4" {...omitNode(props)} />,
          ol: (props) => <ol className="list-decimal list-inside mb-2 ml-4" {...omitNode(props)} />,
          li: (props) => <li className="mb-1" {...omitNode(props)} />,
          strong: (props) => <strong className="font-semibold" {...omitNode(props)} />,
          em: (props) => <em className="italic" {...omitNode(props)} />,
          blockquote: (props) => <blockquote className="border-l-4 border-neutral-300 pl-4 italic text-neutral-600 my-4" {...omitNode(props)} />,
          code: ({ inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const cleanProps = omitNode(props);
            return !inline && match ? (
              <SyntaxHighlighter
                style={dracula}
                language={match[1]}
                PreTag="div"
                {...cleanProps}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className="bg-neutral-100 p-1 rounded font-mono text-sm" {...cleanProps}>
                {children}
              </code>
            );
          },
          pre: (props) => <pre className="bg-neutral-800 text-white p-3 rounded-md overflow-x-auto font-mono text-sm my-4" {...omitNode(props)} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownRenderer
