from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import MobileLoginSerializer, MobileRegisterSerializer

class MobileJWTLoginView(APIView):
    authentication_classes = []
    permission_classes = []
    
    def post(self, request):
        serializer = MobileLoginSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            return Response(serializer.save(), status=status.HTTP_200_OK)
        return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

class MobileJWTRegisterView(APIView):
    authentication_classes = []
    permission_classes = []
    
    def post(self, request):
        serializer = MobileRegisterSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            return Response(serializer.save(), status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)