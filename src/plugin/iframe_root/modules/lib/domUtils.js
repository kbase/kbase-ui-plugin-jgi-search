define([
    'dompurify',
    'kb_common/utils',
    'kb_lib/jsonRpc/exceptions'
], (
    DOMPurify,
    Utils,
    JSONRPCExceptions
) => {
    const donorNode = document.createElement('div');
    function domStrippedText(rawContent) {
        // xss safe
        donorNode.innerHTML = rawContent;
        return donorNode.innerText;
    }

    function domEncodedText(rawContent) {
        donorNode.innerText = rawContent;
        // xss safe
        return donorNode.innerHTML;
    }

    function domSafeErrorMessage(error, defaultMessage) {
        const text = errorMessage(error, defaultMessage);
        return domEncodedText(text);
    }

    const DEFAULT_ERROR_MESSAGE = 'Unknown error';
    function errorMessage(error, defaultMessage) {
        function messageOrDefault(message) {
            return message || defaultMessage || DEFAULT_ERROR_MESSAGE;
        }
        if (typeof error === 'string') {
            return messageOrDefault(error);
        } else if (error instanceof Error) {
            if (error instanceof JSONRPCExceptions.JsonRpcError) {
                return messageOrDefault(error.originalError.message || error.originalError.name);
            }
            return messageOrDefault(error.message || error.name);
        } else if (typeof error === 'object' && error !== null && error.error) {
            // Is probably a KBase service error
            return messageOrDefault(error.error.message || error.name);
        }
        return messageOrDefault();
    }

    function sanitize(content) {
        return DOMPurify.sanitize(content);
    }

    function setInnerHTML(node, content) {
        // xss safe
        node.innerHTML = DOMPurify.sanitize(content);
    }

    function clearInnerHTML(node) {
        // xss safe
        node.innerHTML = '';
    }

    return {
        domStrippedText,
        domEncodedText,
        domSafeErrorMessage,
        errorMessage,
        sanitize,
        setInnerHTML,
        clearInnerHTML
    };
});