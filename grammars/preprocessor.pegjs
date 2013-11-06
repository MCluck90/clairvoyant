/**
 * This defines the language for parsing out any preprocessors before
 * doing the true language parsing
 */

{
    var fs = require('fs'),
        path = require('path'),
        relativeTo = function(p) {
            return path.resolve(options.sourceFolder, p);
        };

    function loadFile(p) {
        return fs.readFileSync(relativeTo(p)).toString();
    }
}


start
    = program:Program { return program; }

SourceCharacter
    = .

StringLiteral "string"
    = parts:('"' DoubleStringCharacters? '"' / "'" SingleStringCharacters? "'") {
        return parts[1];
    }

DoubleStringCharacters
    = chars:DoubleStringCharacter+ { return chars.join(''); }

SingleStringCharacters
    = chars:SingleStringCharacter+ { return chars.join(''); }

DoubleStringCharacter
    = !('"' / "\\") char_:SourceCharacter { return char_; }

SingleStringCharacter
    = !("'" / "\\") char_:SourceCharacter { return char_; }

Preprocessor "preprocessor"
    = "#include " path:StringLiteral {
        return loadFile(path);
    }

Program
    = code:(Preprocessor / SourceCharacter)* {
        return code.join('');
    }