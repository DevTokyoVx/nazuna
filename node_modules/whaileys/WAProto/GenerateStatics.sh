npx pbjs -t static-module --sparse -w commonjs -o ./WAProto/index.js ./WAProto/WAProto.proto;
npx pbts -o ./WAProto/index.d.ts ./WAProto/index.js;

