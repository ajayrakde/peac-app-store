npm install
npm run build
docker build -t lokaltalent .
docker run -p 5000:5000 lokaltalent
